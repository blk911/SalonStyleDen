import { TrustUnit, User } from '../db/models';
import { db } from '../db/models';

export class TrustUnitService {
  async detectPotentialTriads(userId: string): Promise<string[][]> {
    const user = db.getUserById(userId);
    if (!user) return [];

    const allInvitations = db.getInvitations();
    const userConnections = new Set<string>();
    
    allInvitations.forEach(invitation => {
      if (invitation.status === 'accepted') {
        if (invitation.senderId === userId) {
          const recipient = db.getUserByPhone(invitation.recipientPhone);
          if (recipient) userConnections.add(recipient.id);
        }
        
        const sender = db.getUserById(invitation.senderId);
        if (sender && invitation.recipientPhone === user.phone) {
          userConnections.add(sender.id);
        }
      }
    });

    const connections = Array.from(userConnections);
    const potentialTriads: string[][] = [];

    for (let i = 0; i < connections.length; i++) {
      for (let j = i + 1; j < connections.length; j++) {
        const person1 = connections[i];
        const person2 = connections[j];
        
        if (this.areConnected(person1, person2)) {
          potentialTriads.push([userId, person1, person2]);
        }
      }
    }

    return potentialTriads;
  }

  private areConnected(userId1: string, userId2: string): boolean {
    const user1 = db.getUserById(userId1);
    const user2 = db.getUserById(userId2);
    if (!user1 || !user2) return false;

    const invitations = db.getInvitations();
    
    return invitations.some(invitation => 
      invitation.status === 'accepted' && (
        (invitation.senderId === userId1 && invitation.recipientPhone === user2.phone) ||
        (invitation.senderId === userId2 && invitation.recipientPhone === user1.phone)
      )
    );
  }

  async createTrustUnit(memberIds: string[]): Promise<TrustUnit> {
    if (memberIds.length !== 3) {
      throw new Error('Trust unit must have exactly 3 members');
    }

    const existingTrustUnit = db.getTrustUnits().find(unit => 
      unit.memberIds.length === 3 && 
      memberIds.every(id => unit.memberIds.includes(id))
    );

    if (existingTrustUnit) {
      throw new Error('Trust unit already exists for these members');
    }

    const trustUnit = db.createTrustUnit({
      memberIds,
      status: 'forming',
      approvals: []
    });

    return trustUnit;
  }

  async approveTrustUnit(trustUnitId: string, userId: string): Promise<TrustUnit> {
    const trustUnit = db.getTrustUnitById(trustUnitId);
    if (!trustUnit) {
      throw new Error('Trust unit not found');
    }

    if (!trustUnit.memberIds.includes(userId)) {
      throw new Error('User is not a member of this trust unit');
    }

    if (trustUnit.approvals.includes(userId)) {
      throw new Error('User has already approved this trust unit');
    }

    const updatedApprovals = [...trustUnit.approvals, userId];
    const status = updatedApprovals.length === 3 ? 'active' : 'forming';

    const updatedTrustUnit = db.updateTrustUnit(trustUnitId, {
      approvals: updatedApprovals,
      status
    });

    if (!updatedTrustUnit) {
      throw new Error('Failed to update trust unit');
    }

    return updatedTrustUnit;
  }

  async getUserTrustUnits(userId: string): Promise<TrustUnit[]> {
    return db.getTrustUnits().filter(unit => 
      unit.memberIds.includes(userId)
    );
  }
}
