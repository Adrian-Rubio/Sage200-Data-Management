import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Health check to backend
    axios.get('http://localhost:8000/health')
      .then(response => {
        setData(response.data)
        setLoading(false)
      })
      .catch(err => {
        setError('Could not connect to backend. Make sure it is running.')
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Sage200 Dashboard</h1>
          <p className="text-gray-600">Conectando datos de tu ERP</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Estado del Sistema</h2>
            {loading && <p>Comprobando conexión...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {data && (
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${data.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span>API Status: <strong>{data.status}</strong></span>
                </div>
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${data.db_connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span>Database: <strong>{data.db_connected ? 'Connected' : 'Disconnected'}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Placeholder for Metrics */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Métricas Rápidas</h2>
            <p className="text-gray-500">Aquí se mostrarán los KPIs principales.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
