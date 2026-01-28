import { PermissionError } from '../validation/errors.js';
import { ROLE_PARENT, ROLE_FAMILY, ROLE_KID } from '../auth/roles.js';

export function enforceTaskUpdatePermissions(role, existingTask, patch) {
  if (role === ROLE_PARENT) return;

  const allowed = new Set();
  if (role === ROLE_FAMILY) {
    allowed.add('status');
  }
  if (role === ROLE_KID) {
    allowed.add('status');
    allowed.add('order');
  }

  const keys = Object.keys(patch || {});
  const invalid = keys.filter(key => !allowed.has(key));
  if (invalid.length) {
    throw new PermissionError(`Role ${role} cannot update: ${invalid.join(', ')}`);
  }

  if (existingTask.locked && role !== ROLE_PARENT) {
    const lockedKeys = ['locked', 'duration', 'assignedTo', 'date', 'startMinutes'];
    const touched = keys.filter(key => lockedKeys.includes(key));
    if (touched.length) {
      throw new PermissionError('Locked tasks cannot be modified');
    }
  }
}

export function enforceTaskCreatePermissions(role, task) {
  if (role === ROLE_PARENT) return;
  if (role === ROLE_FAMILY) {
    throw new PermissionError('Family role cannot create tasks');
  }
  if (role === ROLE_KID) {
    if (task.createdBy !== 'child' || task.locked) {
      throw new PermissionError('Kid can only create unlocked personal tasks');
    }
  }
}

export function enforceAdminPermissions(role) {
  if (role !== ROLE_PARENT) {
    throw new PermissionError('Admin role required');
  }
}
