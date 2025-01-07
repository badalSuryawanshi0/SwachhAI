import { db } from "./dbConfig";
import {
  Users,
  Notifications,
  Rewards,
  Transactions,
  Reports,
  CollectedWastes,
} from "./schema";
import { eq, sql, and, desc } from "drizzle-orm";
export async function createUser(email: string, name: string) {
  try {
    const [user] = await db
      .insert(Users)
      .values({ email, name })
      .returning()
      .execute();
    return user;
  } catch (error) {
    console.log("Error creating user", error);
    return null;
  }
}
export async function getUserByEmail(email: string) {
  try {
    const [user] = await db
      .select()
      .from(Users)
      .where(eq(Users.email, email))
      .execute();
    return user;
  } catch (error) {
    console.error("Error fetching user by email", error);
    return null;
  }
}
export async function getUnreadNotification(userId: number) {
  try {
    return await db
      .select()
      .from(Notifications)
      .where(
        and(eq(Notifications.userId, userId), eq(Notifications.isRead, false))
      )
      .execute();
  } catch (error) {
    console.log("Error fetching notifications by email", error);
    return null;
  }
}

export async function getUserBalance(userId: number): Promise<number> {
  const transaction = (await getRewardTransactions(userId)) || [];
  {
    const balance = transaction.reduce((acc: number, transaction: any) => {
      return transaction.type.startsWith("earn")
        ? acc + transaction.amount
        : acc - transaction.amount;
    }, 0);
    return Math.max(balance, 0);
  }
}

export async function getRewardTransactions(userId: number) {
  try {
    const transaction = await db
      .select({
        id: Transactions.id,
        type: Transactions.type,
        amount: Transactions.amount,
        description: Transactions.description,
        date: Transactions.date,
      })
      .from(Transactions)
      .where(eq(Transactions.userId, userId))
      .orderBy(desc(Transactions.date))
      .limit(10)
      .execute();
    const formatedTransaction = transaction.map((t) => ({
      ...t,
      date: t.date.toISOString().split("T")[0],
    }));

    return formatedTransaction;
  } catch (error) {
    console.log("Error fetching reward transaction", error);
    return null;
  }
}
export async function getAvailableRewards(userId: number) {
  try {
    const userTransactions = (await getRewardTransactions(userId)) as any; //get last 10 transactions
    const userPoints = userTransactions?.reduce(
      (total: any, transaction: any) => {
        return transaction.type.startsWith("earn")
          ? total + transaction.amount
          : total - transaction.amount;
      },
      0
    );
    const dbReward = await db
      .select({
        id: Rewards.id,
        name: Rewards.name,
        cost: Rewards.points,
        description: Rewards.description,
        collectionInfo: Rewards.collectionInfo,
      })
      .from(Rewards)
      .where(eq(Rewards.isAvailable, true))
      .execute();
    // The dummy record makes it clear
    // how many points the user has and lets them
    //  "compare" it to the cost of actual rewards.
    const allRewards = [
      {
        id: 0,
        name: "Your points",
        cost: userPoints,
        description: "Redeem your earned points",
        collectionInfo: "Points earned from reporting and collecting waste",
      },
      ...dbReward,
    ];
    return allRewards;
  } catch (error) {
    console.error("Error fetcing availabe rewards", error);
    return [];
  }
}
export async function markNotificationAsRead(notificationId: number) {
  try {
    await db
      .update(Notifications)
      .set({ isRead: true })
      .where(eq(Notifications.id, notificationId))
      .execute();
  } catch (error) {
    console.error("Error Updating notification status");
    return null;
  }
}
export async function createReport(
  userId: number,
  location: string,
  wasteType: string,
  amount: string,
  imageUrl?: string,
  verificationResult?: any
) {
  try {
    const [report] = await db
      .insert(Reports)
      .values({
        userId: userId,
        location: location,
        wasteType: wasteType,
        amount: amount,
        imageUrl: imageUrl,
        verificationResult: verificationResult,
        status: "pending",
      })
      .returning()
      .execute();
    const pointsEarned = 10;
    await updateReward(pointsEarned, userId);
    await createTransaction(
      userId,
      "earned_report",
      pointsEarned,
      "Poinst earned from reporting waste"
    );
    await createNotification(
      userId,
      `You've earned ${pointsEarned} for reportng the watse!`,
      "Reward"
    );
  } catch (error) {
    console.log("Error creating Report", error);
  }
}
export async function getRecentReports(limit: number = 5) {
  try {
    const reports = await db
      .select()
      .from(Reports)
      .orderBy(desc(Reports.createdAt))
      .limit(limit)
      .execute();
    return reports;
  } catch (error) {
    console.error("Error fetching recent Reports", error);
  }
}
export async function updateReward(pointsEarned: number, userId: number) {
  try {
    const [updatedReward] = await db
      .update(Rewards)
      .set({
        points: sql`${Rewards.points}+${pointsEarned}`,
      })
      .where(eq(Rewards.userId, userId))
      .returning()
      .execute();
    return updateReward;
  } catch (error) {
    console.error("Error Updating reward points", error);
  }
}
export async function createTransaction(
  userId: number,
  type: "earned_report" | "earned_collect" | "redeemed",
  amount: number,
  description: string
) {
  try {
    const [transaction] = await db
      .insert(Transactions)
      .values({
        userId,
        type,
        amount,
        description,
      })
      .returning()
      .execute();
  } catch (error) {
    console.error("Error creating Transactions", error);
    throw error;
  }
}
export async function createNotification(
  userId: number,
  message: string,
  type: string
) {
  try {
    const [notofication] = await db
      .insert(Notifications)
      .values({
        userId,
        message,
        type,
      })
      .returning()
      .execute();
    return notofication;
  } catch (error) {
    console.error("Error creating notification", error);
  }
}
export async function getWasteCollectionTask(limit: number = 10) {
  try {
    const tasks = await db
      .select({
        id: Reports.id,
        location: Reports.location,
        wasteType: Reports.wasteType,
        amount: Reports.amount,
        status: Reports.status,
        date: Reports.createdAt,
        collectorId: Reports.collectorId,
      })
      .from(Reports)
      .limit(limit)
      .execute();
    return tasks.map((task) => ({
      ...task,
      date: task.date.toISOString().split("T")[0],
    }));
  } catch (error) {
    console.error("Error fetching waste collection task");
    return [];
  }
}

export async function updateTaskStatus(
  reportId: number,
  newStatus: string,
  collectorId?: number
) {
  try {
    const updateData: any = { status: newStatus };
    if (collectorId !== undefined) {
      updateData.collectorId = collectorId;
    }
    const [updateReport] = await db
      .update(Reports)
      .set(updateData)
      .where(eq(Reports.id, reportId))
      .returning()
      .execute();
    return updateReport;
  } catch (error) {
    console.error("Error updating task status");
    throw error;
  }
}
export async function saveReward(userId: any, amount: number) {
  try {
    const [reward] = await db
      .insert(Rewards)
      .values({
        userId,
        name: "Waste collection Reward",
        collectionInfo: "",
        points: amount,
        isAvailable: true,
      })
      .returning()
      .execute();
    //we added reward so we will also need to add the transaction
    await createTransaction(
      userId,
      "earned_collect",
      amount,
      "Points earned from waste collection"
    );
  } catch (error) {
    console.error("Error saving reward ", error);
    throw error;
  }
}
export default async function saveCollectionWaste(
  taskId: any,
  collectorId: any
) {
  try {
    await db
      .insert(CollectedWastes)
      .values({
        reportId: taskId,
        collectorId: collectorId,
        collectionDate: new Date(),
        status: "verified",
      })
      .returning()
      .execute();
    return CollectedWastes;
  } catch (error) {
    console.error("Error saving collected waste:", error);
    throw error;
  }
}
