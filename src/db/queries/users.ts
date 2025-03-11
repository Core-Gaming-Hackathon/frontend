// import { db } from '../index';
// import { users, userStats } from '../schema';
// import { eq } from 'drizzle-orm';

// export const usersQueries = {
//   async getUser(address: string) {
//     return await db.query.users.findFirst({
//       where: eq(users.address, address.toLowerCase()),
//       with: {
//         stats: true,
//       },
//     });
//   },

//   async createUser(address: string, nonce: string) {
//     const [user] = await db.insert(users)
//       .values({
//         address: address.toLowerCase(),
//         nonce,
//       })
//       .returning();
    
//     await db.insert(userStats)
//       .values({
//         userId: user.id,
//       });
    
//     return user;
//   },
// };