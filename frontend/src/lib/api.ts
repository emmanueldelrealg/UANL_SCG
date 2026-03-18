import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 30000 });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('scg_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('scg_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authApi = {
  login: (d: {username:string,password:string}) => api.post('/auth/login',d),
  me: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  createUser: (d: any) => api.post('/auth/users',d),
  updateUser: (id: number, d: any) => api.put(`/auth/users/${id}`,d),
};

// Accounts
export const accountsApi = {
  getAll: (p?: any) => api.get('/accounts',{params:p}),
  getTree: () => api.get('/accounts/tree'),
  getOne: (code: string) => api.get(`/accounts/${code}`),
  create: (d: any) => api.post('/accounts',d),
  update: (id: number, d: any) => api.put(`/accounts/${id}`,d),
};

// Journal Entries
export const entriesApi = {
  getAll: (p?: any) => api.get('/entries',{params:p}),
  getOne: (id: number) => api.get(`/entries/${id}`),
  create: (d: any) => api.post('/entries',d),
  authorize: (id: number) => api.patch(`/entries/${id}/authorize`),
  cancel: (id: number) => api.patch(`/entries/${id}/cancel`),
  getTemplates: () => api.get('/entries/templates/all'),
};

// Budget
export const budgetApi = {
  getLines: (p?: any) => api.get('/budget/lines',{params:p}),
  getLinesSummary: (p?: any) => api.get('/budget/lines/summary',{params:p}),
  createLine: (d: any) => api.post('/budget/lines',d),
  getIncome: (p?: any) => api.get('/budget/income',{params:p}),
  getModifications: (p?: any) => api.get('/budget/modifications',{params:p}),
  createModification: (d: any) => api.post('/budget/modifications',d),
  getPrograms: (p?: any) => api.get('/budget/programs',{params:p}),
  getCog: (p?: any) => api.get('/budget/cog',{params:p}),
  getFinancingSources: () => api.get('/budget/financing-sources'),
  getResponsibleUnits: () => api.get('/budget/responsible-units'),
  getFunctional: () => api.get('/budget/functional'),
};

// Reports
export const reportsApi = {
  getBalanza: (p?: any) => api.get('/reports/balanza',{params:p}),
  getDiario: (p?: any) => api.get('/reports/diario',{params:p}),
  getMayor: (code: string, p?: any) => api.get(`/reports/mayor/${code}`,{params:p}),
  getSituacionFinanciera: (p?: any) => api.get('/reports/situacion-financiera',{params:p}),
  getActividades: (p?: any) => api.get('/reports/actividades',{params:p}),
  getActivo: (p?: any) => api.get('/reports/activo',{params:p}),
  getEAI: (p?: any) => api.get('/reports/eai',{params:p}),
  getEAEPE: (p?: any) => api.get('/reports/eaepe',{params:p}),
  getFiscalYears: () => api.get('/reports/fiscal-years'),
  createFiscalYear: (d: any) => api.post('/reports/fiscal-years',d),
  getAudit: (p?: any) => api.get('/reports/audit',{params:p}),
};

// Inventory
export const inventoryApi = {
  getAll: (p?: any) => api.get('/inventory',{params:p}),
  getOne: (id: number) => api.get(`/inventory/${id}`),
  create: (d: any) => api.post('/inventory',d),
  addMovement: (id: number, d: any) => api.post(`/inventory/${id}/movements`,d),
  calcDepreciation: (d: any) => api.post('/inventory/depreciation',d),
};

// Debt
export const debtApi = {
  getAll: (p?: any) => api.get('/debt',{params:p}),
  getOne: (id: number) => api.get(`/debt/${id}`),
  create: (d: any) => api.post('/debt',d),
  addPayment: (id: number, d: any) => api.post(`/debt/${id}/payments`,d),
  getSummary: (fy: number) => api.get(`/debt/summary/${fy}`),
};

// Educational
export const educationalApi = {
  getGlossary: (p?: any) => api.get('/educational/glossary',{params:p}),
  getExercises: (p?: any) => api.get('/educational/exercises',{params:p}),
  getExercise: (id: number) => api.get(`/educational/exercises/${id}`),
  submitExercise: (id: number, d: any) => api.post(`/educational/exercises/${id}/submit`,d),
  getDashboard: (userId: string) => api.get(`/educational/dashboard/${userId}`),
};
