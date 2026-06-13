import mongoose from "mongoose";

export async function runInTransaction<T>(
  work: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    if (result === undefined) {
      throw new Error("Transaction did not yield a result");
    }
    return result;
  } finally {
    await session.endSession();
  }
}