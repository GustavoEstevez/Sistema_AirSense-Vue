import { Capacitor, registerPlugin } from '@capacitor/core'

const DeviceSetup = registerPlugin('DeviceSetup')

export async function openWifiSettings() {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('El asistente Wi-Fi está disponible dentro de la aplicación Android.')
  }
  await DeviceSetup.openWifiSettings()
}

export async function openProvisioningPortal() {
  if (!Capacitor.isNativePlatform()) {
    window.open('http://192.168.4.1', '_blank', 'noopener')
    return
  }
  await DeviceSetup.openProvisioningPortal()
}
