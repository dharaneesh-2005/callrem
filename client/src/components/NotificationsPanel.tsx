import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Clock, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const { data: reminders } = useQuery({
    queryKey: ["/api/reminders"],
  });

  const { data: studentFees } = useQuery({
    queryKey: ["/api/student-fees"],
  });

  // Get pending payments
  const pendingPayments = Array.isArray(studentFees) 
    ? studentFees.filter((fee: any) => fee.pendingAmount > 0).slice(0, 5)
    : [];

  // Get recent reminders
  const recentReminders = Array.isArray(reminders)
    ? reminders.slice(0, 5)
    : [];

  const notifications = [
    ...pendingPayments.map((fee: any) => ({
      id: `fee-${fee.id}`,
      type: 'warning',
      title: 'Pending Payment',
      message: `${fee.student?.firstName} ${fee.student?.lastName} - ₹${fee.pendingAmount} pending`,
      time: new Date(fee.updatedAt).toLocaleDateString(),
    })),
    ...recentReminders.map((reminder: any) => ({
      id: `reminder-${reminder.id}`,
      type: reminder.status === 'sent' ? 'success' : 'info',
      title: 'Reminder',
      message: reminder.message?.substring(0, 50) + '...',
      time: new Date(reminder.createdAt).toLocaleDateString(),
    })),
  ].slice(0, 10);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 bg-[#1a1a1a] border-l border-white/10 shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-bold text-white">Notifications</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-[#242424] rounded-xl border border-white/5 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          notification.type === 'success' ? 'bg-green-500/10' :
                          notification.type === 'warning' ? 'bg-orange-500/10' :
                          'bg-blue-500/10'
                        }`}>
                          {notification.type === 'success' ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : notification.type === 'warning' ? (
                            <AlertCircle className="w-4 h-4 text-orange-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-white mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-xs text-zinc-400 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-zinc-600">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Bell className="w-16 h-16 text-zinc-600 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      No notifications
                    </h3>
                    <p className="text-sm text-zinc-400">
                      You're all caught up!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
