import type { ComplianceRecord } from '../../domain/model/types'
import type { ComplianceRepository } from './ComplianceRepository'

/**
 * Offline-first stub backed by IndexedDB.
 * Saves records locally with syncStatus='LOCAL'; a background sync worker
 * would flush these to SupabaseComplianceRepository on reconnect.
 * Wired in AppShell when navigator.onLine === false (debrief: offline-first).
 */
export class IndexedDBComplianceRepository implements ComplianceRepository {
  private readonly dbName = 'sentinel_compliance'
  private readonly storeName = 'records'
  private db: IDBDatabase | null = null

  private async openDb(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        if (!database.objectStoreNames.contains(this.storeName)) {
          database.createObjectStore(this.storeName, { keyPath: 'id' })
        }
      }

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        resolve(this.db)
      }

      request.onerror = () => reject(new Error('Failed to open IndexedDB'))
    })
  }

  async save(record: ComplianceRecord): Promise<void> {
    const database = await this.openDb()
    const localRecord: ComplianceRecord = { ...record, syncStatus: 'LOCAL' }

    return new Promise((resolve, reject) => {
      const tx = database.transaction(this.storeName, 'readwrite')
      const request = tx.objectStore(this.storeName).put(localRecord)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('IndexedDB save failed'))
    })
  }

  async list(): Promise<ComplianceRecord[]> {
    const database = await this.openDb()

    return new Promise((resolve, reject) => {
      const tx = database.transaction(this.storeName, 'readonly')
      const request = tx.objectStore(this.storeName).getAll()
      request.onsuccess = () => resolve((request.result as ComplianceRecord[]) ?? [])
      request.onerror = () => reject(new Error('IndexedDB list failed'))
    })
  }

  async getByClientId(clientId: string): Promise<ComplianceRecord[]> {
    const all = await this.list()
    return all.filter((record) => record.clientId === clientId)
  }
}
