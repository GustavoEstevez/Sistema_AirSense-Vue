export const HISTORY_POINT_LIMIT = 240

// Older environments remain usable with a visibly partial, bounded snapshot.
export async function loadHistorySummary(client, { deviceId, from, to, signal }) {
  const { data, error } = await client.rpc('get_reading_history_summary', {
    p_device_id: deviceId,
    p_from: from,
    p_to: to,
  }).abortSignal(signal)
  if (signal.aborted) return null
  if (!error) {
    if (!Array.isArray(data?.points) || data.points.length > HISTORY_POINT_LIMIT
      || !Number.isSafeInteger(data.total_count) || data.total_count < data.points.length
      || data.points.some(row => row.device_id !== deviceId)) {
      throw new Error('El resumen del historial no tiene un formato válido.')
    }
    return { readings: data.points, total: data.total_count, partial: false }
  }
  if (error.code !== 'PGRST202') throw error

  let query = client.from('sensor_readings')
    .select('id, device_id, temperature, humidity, noise, co2, recorded_at')
    .eq('device_id', deviceId)
    .lte('recorded_at', to)
    .order('recorded_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(HISTORY_POINT_LIMIT)
    .abortSignal(signal)
  if (from) query = query.gte('recorded_at', from)
  const { data: rows, error: queryError } = await query
  if (signal.aborted) return null
  if (queryError) throw queryError
  return { readings: [...(rows || [])].reverse(), total: null, partial: true }
}
