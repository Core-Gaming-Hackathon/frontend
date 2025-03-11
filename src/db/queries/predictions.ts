// import { db } from '../index';
// import { predictions, bets } from '../schema';
// import { eq, desc } from 'drizzle-orm';

// export const predictionsQueries = {
//   async getPrediction(predictionId: string) {
//     return await db.query.predictions.findFirst({
//       where: eq(predictions.id, predictionId),
//       with: {
//         options: true,
//         bets: true,
//       },
//     });
//   },

//   async getPredictions(limit: number = 10, offset: number = 0) {
//     return await db.query.predictions.findMany({
//       limit,
//       offset,
//       orderBy: [desc(predictions.createdAt)],
//       with: {
//         options: true,
//       },
//     });
//   },

//   async getUserBets(address: string) {
//     return await db.query.bets.findMany({
//       where: eq(bets.bettor, address.toLowerCase()),
//       with: {
//         prediction: {
//           with: {
//             options: true,
//           },
//         },
//       },
//     });
//   },
// };