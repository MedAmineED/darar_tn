import { getCurrentLocale, type AdminLocale } from '@/lib/locale';
import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { tokenStore } from './token-store';
import type { ApiError, ApiSuccess, AuthSession } from './types';

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const apiClient = axios.create({ baseURL, withCredentials: true });

/** Invoked when the session cannot be recovered (refresh failed). */
let authFailureHandler: (() => void) | null = null;
export function setAuthFailureHandler(handler: (() => void) | null): void {
  authFailureHandler = handler;
}

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// De-duplicate concurrent refresh attempts.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await axios.post<ApiSuccess<AuthSession>>(
      `${baseURL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const token = res.data.data.accessToken;
    tokenStore.set(token);
    return token;
  } catch {
    tokenStore.set(null);
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout');

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      refreshPromise = refreshPromise ?? refreshAccessToken();
      const token = await refreshPromise;
      refreshPromise = null;

      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      }
      authFailureHandler?.();
    }
    return Promise.reject(error);
  },
);

/** Extracts the payload from the API success envelope. */
export function unwrap<T>(res: AxiosResponse<ApiSuccess<T>>): T {
  return res.data.data;
}

const operationalErrors: Record<string, string> = {
  INSUFFICIENT_STOCK:
    'الكمية غير كافية لأحد المنتجات. راجع المخزون قبل تأكيد الطلب.',
  INVALID_STOCK_BALANCE:
    'لا يمكن أن يصبح المخزون سالبًا أو يتجاوز الحد المسموح.',
  INVALID_ORDER_TRANSITION: 'لا يمكن الانتقال إلى حالة الطلب المختارة.',
  INVALID_INITIAL_STATUS: 'يبدأ الطلب الجديد قيد الانتظار أو مؤكدًا.',
  INVENTORY_NOT_FOUND: 'لم يتم العثور على سجل مخزون هذا المنتج.',
  STOCK_CONFLICT: 'تغير المخزون بالتزامن مع هذه العملية. أعد المحاولة.',
  IDEMPOTENCY_KEY_REUSED:
    'أُرسلت هذه العملية سابقًا ببيانات مختلفة. راجع الطلبات قبل إنشاء طلب جديد.',
};

const frenchOperationalErrors: Record<string, string> = {
  SKU_TAKEN: 'Cette référence produit est déjà utilisée.',
  CATEGORY_NOT_FOUND: 'La catégorie demandée est introuvable.',
  CATEGORY_HAS_CHILDREN:
    'Supprimez ou déplacez les sous-catégories avant de supprimer cette catégorie.',
  CATEGORY_INVALID_PARENT: 'Cette catégorie parente est invalide.',
  CATEGORY_CYCLE: 'Une catégorie ne peut pas être sa propre descendante.',
  CUSTOMER_HAS_ORDERS:
    'Ce client possède des commandes et ne peut pas être supprimé.',
  CUSTOMER_EMAIL_TAKEN:
    'Cette adresse e-mail est déjà utilisée par un autre client.',
  CUSTOMER_NOT_FOUND: 'Le client demandé est introuvable.',
  CUSTOMER_NAME_REQUIRED: 'Saisissez le nom du client invité.',
  PRODUCT_NOT_FOUND: 'Le produit demandé est introuvable.',
  PRODUCT_UNAVAILABLE: 'Un produit de la commande n’est plus disponible.',
  ORDER_NOT_FOUND: 'La commande demandée est introuvable.',
  INVALID_ORDER_TOTAL: 'Le total de la commande est invalide.',
  INVALID_IDEMPOTENCY_KEY:
    'La référence de cette opération est invalide. Actualisez la page.',
  INVENTORY_STATE_MISSING:
    'L’état du stock de cette commande est indisponible.',
  NO_FILE: 'Choisissez une image à importer.',
  NO_FILES: 'Choisissez au moins une image à importer.',
  INVALID_FILE_TYPE: 'Choisissez une image JPG, PNG ou WebP.',
  INVALID_IMAGE_ORDER: 'L’ordre des images est invalide. Actualisez la page.',
  IMAGE_NOT_FOUND: 'L’image demandée est introuvable.',
  FORBIDDEN_PERMISSION: 'Vous n’avez pas l’autorisation nécessaire.',
  INSUFFICIENT_STOCK:
    'Stock insuffisant pour un produit. Vérifiez le stock avant de confirmer la commande.',
  INVALID_STOCK_BALANCE:
    'Le stock doit rester positif ou nul et respecter la limite autorisée.',
  INVALID_ORDER_TRANSITION:
    'Ce changement de statut de commande est impossible.',
  INVALID_INITIAL_STATUS:
    'Une nouvelle commande doit être en attente ou confirmée.',
  INVENTORY_NOT_FOUND: 'Le stock de ce produit est introuvable.',
  STOCK_CONFLICT: 'Le stock a été modifié pendant cette opération. Réessayez.',
  IDEMPOTENCY_KEY_REUSED:
    'Cette opération a déjà été envoyée avec d’autres données. Vérifiez les commandes avant de réessayer.',
  INVALID_CREDENTIALS: 'Adresse e-mail ou mot de passe incorrect.',
  USER_INACTIVE: 'Ce compte est désactivé.',
  VALIDATION_ERROR: 'Vérifiez les champs du formulaire.',
  UNIQUE_CONSTRAINT_VIOLATION: 'Cette valeur est déjà utilisée.',
  FOREIGN_KEY_CONSTRAINT:
    'Cet élément est encore utilisé par d’autres données.',
  INVALID_CURRENT_PASSWORD: 'Le mot de passe actuel est incorrect.',
  FORBIDDEN: 'Vous n’avez pas l’autorisation nécessaire.',
  UNAUTHORIZED: 'Votre session a expiré. Reconnectez-vous.',
  NOT_FOUND: 'L’élément demandé est introuvable.',
  RECORD_NOT_FOUND: 'L’élément demandé est introuvable.',
  CONFLICT: 'Cette modification entre en conflit avec les données actuelles.',
  TOO_MANY_REQUESTS:
    'Trop de tentatives. Veuillez patienter avant de réessayer.',
};

/** Translate known business failures and keep untranslated server details out of French UI. */
export function getApiErrorMessage(
  error: unknown,
  locale: AdminLocale = getCurrentLocale(),
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    const code = data?.error?.code;
    if (locale === 'fr') {
      if (code && frenchOperationalErrors[code])
        return frenchOperationalErrors[code];
      if (error.response?.status === 403)
        return frenchOperationalErrors.FORBIDDEN;
      if (error.response?.status === 401)
        return frenchOperationalErrors.UNAUTHORIZED;
      if (error.response?.status === 404)
        return frenchOperationalErrors.NOT_FOUND;
      if (error.response?.status === 400)
        return frenchOperationalErrors.VALIDATION_ERROR;
    } else {
      if (code && operationalErrors[code]) return operationalErrors[code];
      if (data?.message) return data.message;
    }
  }
  return locale === 'fr'
    ? 'Une erreur est survenue. Veuillez réessayer.'
    : 'حدث خطأ ما، يرجى المحاولة مرة أخرى';
}
