import {
  DynamoDBClient,
  ScanCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";

export * from "./test-auth-utils";

const getTestClient = (): DynamoDBClient =>
  new DynamoDBClient({
    endpoint: "http://localhost:4566",
    region: "eu-west-2",
    credentials: {
      accessKeyId: "test",
      secretAccessKey: "test",
    },
  });

// Clear all data from the todos table for integration tests
export async function clearTodosTable(): Promise<void> {
  const client = getTestClient();

  try {
    const scanResponse = await client.send(
      new ScanCommand({
        TableName: "todos",
      })
    );

    if (scanResponse.Items && scanResponse.Items.length > 0) {
      // Delete all items
      const deletePromises = scanResponse.Items.map((item) =>
        client.send(
          new DeleteItemCommand({
            TableName: "todos",
            Key: {
              id: item.id,
            },
          })
        )
      );
      await Promise.all(deletePromises);
      console.log(
        `Cleared ${scanResponse.Items.length} items from todos table`
      );
    }
  } catch (error) {
    console.warn(
      "Could not clear todos table (LocalStack may not be running):",
      error
    );
  }
}
