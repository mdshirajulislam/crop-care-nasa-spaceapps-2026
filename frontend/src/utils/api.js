const API_BASE = '/api/v1';

// --- Weather & Climatology ---
export const fetchWeather = async () => {
  const res = await fetch(`${API_BASE}/weather/forecast`);
  if (!res.ok) throw new Error('Weather API error');
  return res.json();
};

export const fetchNasaClimatology = async () => {
  const res = await fetch(`${API_BASE}/weather/nasa-climatology`);
  if (!res.ok) throw new Error('Climatology API error');
  return res.json();
};

// --- Plots & Lands ---
export const fetchPlots = async () => {
  const res = await fetch(`${API_BASE}/plots/`);
  if (!res.ok) throw new Error('Plots API error');
  return res.json();
};

export const addPlot = async (data) => {
  const res = await fetch(`${API_BASE}/plots/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Add plot error');
  return res.json();
};

export const updatePlot = async (id, data) => {
  const res = await fetch(`${API_BASE}/plots/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Update plot error');
  return res.json();
};

export const deletePlot = async (id) => {
  const res = await fetch(`${API_BASE}/plots/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Delete plot error');
  return res.json();
};

// --- Planting Advisor ---
export const fetchPlantingAdvice = async (cropId = 'aman_rice', plantingDate = null) => {
  const url = plantingDate 
    ? `${API_BASE}/planting/advisor?crop_id=${cropId}&planting_date=${plantingDate}`
    : `${API_BASE}/planting/advisor?crop_id=${cropId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Planting advisor API error');
  return res.json();
};

export const fetchCropsList = async () => {
  const res = await fetch(`${API_BASE}/planting/crops`);
  if (!res.ok) throw new Error('Crops list API error');
  return res.json();
};

// --- Disease Diagnosis ---
export const diagnoseDisease = async (data) => {
  const res = await fetch(`${API_BASE}/disease/diagnose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Diagnosis API error');
  return res.json();
};

export const fetchDiseaseLibrary = async () => {
  const res = await fetch(`${API_BASE}/disease/library`);
  if (!res.ok) throw new Error('Disease library API error');
  return res.json();
};

export const fetchOutbreakAlerts = async () => {
  const res = await fetch(`${API_BASE}/disease/outbreaks`);
  if (!res.ok) throw new Error('Outbreak alerts API error');
  return res.json();
};

// --- Farm Diary Activities ---
export const fetchActivities = async () => {
  const res = await fetch(`${API_BASE}/diary/activities`);
  if (!res.ok) throw new Error('Activities API error');
  return res.json();
};

export const addActivity = async (data) => {
  const res = await fetch(`${API_BASE}/diary/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Add activity error');
  return res.json();
};

export const updateActivity = async (id, data) => {
  const res = await fetch(`${API_BASE}/diary/activities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Update activity error');
  return res.json();
};

export const deleteActivity = async (id) => {
  const res = await fetch(`${API_BASE}/diary/activities/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Delete activity error');
  return res.json();
};

// --- Expenses ---
export const fetchExpenses = async () => {
  const res = await fetch(`${API_BASE}/diary/expenses`);
  if (!res.ok) throw new Error('Expenses API error');
  return res.json();
};

export const addExpense = async (data) => {
  const res = await fetch(`${API_BASE}/diary/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Add expense error');
  return res.json();
};

export const updateExpense = async (id, data) => {
  const res = await fetch(`${API_BASE}/diary/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Update expense error');
  return res.json();
};

export const deleteExpense = async (id) => {
  const res = await fetch(`${API_BASE}/diary/expenses/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Delete expense error');
  return res.json();
};

// --- Harvests ---
export const fetchHarvests = async () => {
  const res = await fetch(`${API_BASE}/diary/harvests`);
  if (!res.ok) throw new Error('Harvests API error');
  return res.json();
};

export const addHarvest = async (data) => {
  const res = await fetch(`${API_BASE}/diary/harvests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Add harvest error');
  return res.json();
};

export const updateHarvest = async (id, data) => {
  const res = await fetch(`${API_BASE}/diary/harvests/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Update harvest error');
  return res.json();
};

export const deleteHarvest = async (id) => {
  const res = await fetch(`${API_BASE}/diary/harvests/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Delete harvest error');
  return res.json();
};

export const fetchFinancialSummary = async () => {
  const res = await fetch(`${API_BASE}/diary/financial-summary`);
  if (!res.ok) throw new Error('Financial summary API error');
  return res.json();
};

// --- Chat ---
export const askAiAssistant = async (message) => {
  const res = await fetch(`${API_BASE}/chat/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  if (!res.ok) throw new Error('Chat API error');
  return res.json();
};

// --- Satellite ---
export const fetchNdviTimeSeries = async () => {
  const res = await fetch(`${API_BASE}/satellite/ndvi-timeseries`);
  if (!res.ok) throw new Error('NDVI timeseries API error');
  return res.json();
};

// --- Profile ---
export const fetchProfile = async () => {
  const res = await fetch(`${API_BASE}/auth/profile`);
  if (!res.ok) throw new Error('Profile API error');
  return res.json();
};

export const updateProfile = async (data) => {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Update profile error');
  return res.json();
};

// --- Advanced NASA Features (100% Free NASA Earth Science Data) ---
export const fetchIrrigationAdvisor = async (cropType = 'aman_rice', landBigha = 3.5) => {
  const res = await fetch(`${API_BASE}/nasa-features/irrigation-advisor?crop_type=${cropType}&land_bigha=${landBigha}`);
  if (!res.ok) throw new Error('Irrigation advisor error');
  return res.json();
};

export const fetchFlashFloodWarning = async (region = 'haor') => {
  const res = await fetch(`${API_BASE}/nasa-features/flash-flood-warning?region=${region}`);
  if (!res.ok) throw new Error('Flash flood warning error');
  return res.json();
};

export const generateInsuranceCertificate = async (data) => {
  const res = await fetch(`${API_BASE}/nasa-features/insurance-certificate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Insurance certificate error');
  return res.json();
};

export const fetchPestRadar = async () => {
  const res = await fetch(`${API_BASE}/nasa-features/community-pest-radar`);
  if (!res.ok) throw new Error('Pest radar error');
  return res.json();
};

