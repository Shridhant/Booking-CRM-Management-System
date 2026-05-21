import api from "./axios"
import type { AvailabilitySlot, TimeOff } from "../types"


export const getAvailabilityApi = async (
  businessId: string,
  employeeId: string
): Promise<AvailabilitySlot[]> => {
  const res = await api.get(
    `/businesses/${businessId}/employees/${employeeId}/availability`
  )
  return res.data.data
}

export const setAvailabilityApi = async (
  businessId: string,
  employeeId: string,
  schedule: {
    day_of_week: number
    is_off: boolean
    start_time?: string
    end_time?: string
  }[]
): Promise<AvailabilitySlot[]> => {
  const res = await api.post(
    `/businesses/${businessId}/employees/${employeeId}/availability`,
    { schedule }
  )
  return res.data.data
}

export const listTimeOffApi = async (
  businessId: string,
  employeeId: string
): Promise<TimeOff[]> => {
  const res = await api.get(
    `/businesses/${businessId}/employees/${employeeId}/availability/time-off`
  )
  return res.data.data
}

export const createTimeOffApi = async (
  businessId: string,
  employeeId: string,
  data: { start_datetime: string; end_datetime: string; reason?: string }
): Promise<TimeOff> => {
  const res = await api.post(
    `/businesses/${businessId}/employees/${employeeId}/availability/time-off`,
    data
  )
  return res.data.data
}

export const deleteTimeOffApi = async (
  businessId: string,
  employeeId: string,
  timeOffId: string
): Promise<void> => {
  await api.delete(
    `/businesses/${businessId}/employees/${employeeId}/availability/time-off/${timeOffId}`
  )
}
