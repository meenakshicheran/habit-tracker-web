'use client';

import { motion } from 'framer-motion';
import { Bell, Download, Trash2, Upload, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useEffect, useRef, useState } from 'react';
import { useUpdateSettings, useUserStats } from '@/lib/hooks/useHabits';

const CATEGORIES = ['General', 'Health', 'Fitness', 'Mindfulness', 'Productivity', 'Learning', 'Social', 'Finance'];

type PermissionState = 'granted' | 'denied' | 'default';

interface ImportPreview { habitsCount: number; logsCount: number; journalsCount: number }

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: userStats } = useUserStats();
  const { mutate: saveSettings, isPending: isSaving } = useUpdateSettings();
  const qc = useQueryClient();

  // Profile section
  const [displayName, setDisplayName] = useState('');
  useEffect(() => {
    setDisplayName(userStats?.name ?? session?.user?.name ?? '');
  }, [userStats?.name, session?.user?.name]);

  // Notifications section
  const [permission, setPermission] = useState<PermissionState>('default');
  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission as PermissionState);
  }, []);

  // Habits defaults section
  const [defaultReminderTime, setDefaultReminderTime] = useState('');
  const [defaultCategory, setDefaultCategory] = useState('General');
  useEffect(() => {
    setDefaultReminderTime(userStats?.reminderTime ?? '');
    setDefaultCategory(userStats?.defaultCategory ?? 'General');
  }, [userStats?.reminderTime, userStats?.defaultCategory]);

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importPayload, setImportPayload] = useState<unknown>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importDone, setImportDone] = useState<{ habits: number; logs: number; journals: number } | null>(null);

  // Danger zone
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const json = JSON.parse(text);
    setImportPayload(json);
    const res = await fetch('/api/import?preview=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(json),
    });
    const data = await res.json();
    setImportPreview(data);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleImportConfirm() {
    if (!importPayload) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importPayload),
      });
      const data = await res.json();
      setImportDone(data.imported);
      setImportPreview(null);
      setImportPayload(null);
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`${data.imported.habits} habits imported`);
    } finally {
      setIsImporting(false);
    }
  }

  async function handleDeleteAll() {
    setIsDeleting(true);
    try {
      await fetch('/api/habits/all', { method: 'DELETE' });
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'heatmap'] });
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  }

  async function requestPermission() {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result as PermissionState);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Settings</h1>

      {/* Profile */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-border rounded-2xl p-6 mb-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-text-muted" />
          <h2 className="text-sm font-semibold text-text-primary">Profile</h2>
        </div>
        <label className="block text-xs text-text-muted mb-1">Display name</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent transition-colors"
          placeholder="Your name"
        />
        <button
          disabled={isSaving}
          onClick={() => saveSettings({ name: displayName }, { onSuccess: () => toast.success('Settings updated') })}
          className="mt-3 px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
        >
          Save
        </button>
      </motion.section>

      {/* Notifications */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-surface border border-border rounded-2xl p-6 mb-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-text-muted" />
          <h2 className="text-sm font-semibold text-text-primary">Notifications</h2>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-text-primary">Enable habit reminders</p>
            <p className="text-xs text-text-muted mt-0.5">Fire a notification at each habit&apos;s reminder time</p>
          </div>
          <button
            role="switch"
            aria-checked={userStats?.notificationsEnabled ?? true}
            onClick={() => saveSettings({ notificationsEnabled: !(userStats?.notificationsEnabled ?? true) })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${
              (userStats?.notificationsEnabled ?? true) ? 'bg-indigo-500' : 'bg-surface-raised border border-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                (userStats?.notificationsEnabled ?? true) ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Browser permission:</span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              permission === 'granted'
                ? 'bg-emerald-500/15 text-emerald-400'
                : permission === 'denied'
                ? 'bg-red-500/15 text-red-400'
                : 'bg-yellow-500/15 text-yellow-400'
            }`}
          >
            {permission === 'granted' ? 'Granted' : permission === 'denied' ? 'Denied' : 'Not asked'}
          </span>
          {permission !== 'granted' && (
            <button
              onClick={requestPermission}
              className="text-xs px-2.5 py-1 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
            >
              Request permission
            </button>
          )}
        </div>
      </motion.section>

      {/* Habits defaults + Export/Import */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface border border-border rounded-2xl p-6 mb-4"
      >
        <h2 className="text-sm font-semibold text-text-primary mb-4">Habits</h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">Default reminder time</label>
            <input
              type="time"
              value={defaultReminderTime}
              onChange={(e) => setDefaultReminderTime(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Default category</label>
            <select
              value={defaultCategory}
              onChange={(e) => setDefaultCategory(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent transition-colors"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button
          disabled={isSaving}
          onClick={() => saveSettings({ defaultReminderTime: defaultReminderTime || null, defaultCategory }, { onSuccess: () => toast.success('Settings updated') })}
          className="mb-5 px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
        >
          Save defaults
        </button>

        <div className="border-t border-border pt-4">
          <p className="text-xs font-medium text-text-secondary mb-3">Export / Import</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { window.location.href = '/api/export'; toast.success('Export ready'); }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
            <button
              onClick={() => { window.location.href = '/api/export?format=csv'; toast.success('Export ready'); }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Import data
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
          </div>

          {importDone && (
            <p className="mt-2 text-xs text-emerald-400">
              Imported {importDone.habits} habits, {importDone.logs} logs, {importDone.journals} journal entries.
            </p>
          )}
        </div>
      </motion.section>

      {/* Danger zone */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-surface border border-red-500/20 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold text-red-400">Danger zone</h2>
        </div>
        <p className="text-xs text-text-muted mb-3">
          This will delete all your habits and completion history. Your account will remain.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-1.5 rounded-lg text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
        >
          Delete all habit data
        </button>
      </motion.section>

      {/* Import preview modal */}
      {importPreview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full"
          >
            <h3 className="text-base font-semibold text-text-primary mb-2">Confirm import</h3>
            <p className="text-sm text-text-secondary mb-4">
              This will import <strong>{importPreview.habitsCount}</strong> habits,{' '}
              <strong>{importPreview.logsCount}</strong> completion logs, and{' '}
              <strong>{importPreview.journalsCount}</strong> journal entries.
              Existing entries will be skipped.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setImportPreview(null); setImportPayload(null); }}
                className="px-3 py-1.5 text-sm rounded-lg border border-border text-text-secondary hover:bg-surface-raised transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isImporting}
                onClick={handleImportConfirm}
                className="px-3 py-1.5 text-sm rounded-lg text-white font-medium disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
              >
                {isImporting ? 'Importing…' : 'Import'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full"
          >
            <h3 className="text-base font-semibold text-text-primary mb-2">Delete all habit data?</h3>
            <p className="text-sm text-text-secondary mb-4">
              This will permanently delete all your habits and completion history. Your account will remain. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 text-sm rounded-lg border border-border text-text-secondary hover:bg-surface-raised transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteAll}
                className="px-3 py-1.5 text-sm rounded-lg text-white font-medium bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {isDeleting ? 'Deleting…' : 'Delete everything'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
