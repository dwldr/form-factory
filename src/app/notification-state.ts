export interface NotificationRecord {
  id: string;
  message: string;
  createdAt: string;
  seen: boolean;
  highlighted: boolean;
}

export function addNotification(
  records: NotificationRecord[],
  id: string,
  message: string,
  createdAt: string,
): NotificationRecord[] {
  if (!message.trim()) return records;
  return [
    { id, message, createdAt, seen: false, highlighted: true },
    ...records,
  ];
}

/** Keep first-view highlights; clear them on the following opening. */
export function openNotifications(
  records: NotificationRecord[],
): NotificationRecord[] {
  return records.map((record) => ({
    ...record,
    highlighted: !record.seen,
    seen: true,
  }));
}
