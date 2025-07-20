import connectMongoose from '../libs/mongoose';
import User from '../models/User';

async function grantFullAccessToAllUsers() {
  try {
    await connectMongoose();
    
    // Update ALL users to have full admin permissions
    const result = await User.updateMany(
      {}, // Empty filter to match all users
      {
        $set: {
          'role.name': 'admin',
          'role.permissions': [
            'canManageUsers',
            'canManageInventory',
            'canManageSales',
            'canManagePurchases',
            'canManageReports',
            'canViewReports',
            'canManageSettings'
          ],
          'role.customPermissions': {
            inventory: { view: true, create: true, edit: true, delete: true },
            sales: { view: true, create: true, edit: true, delete: true, approve: true },
            purchases: { view: true, create: true, edit: true, delete: true, approve: true },
            reports: { view: true, export: true, advanced: true },
            settings: { view: true, edit: true, users: true, billing: true }
          }
        }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} users with full admin permissions`);
    console.log('All users now have complete access to all features!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating user permissions:', error);
    process.exit(1);
  }
}

grantFullAccessToAllUsers();
