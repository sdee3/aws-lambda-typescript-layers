import { APIGatewayProxyEvent } from "aws-lambda";

export interface GetS3ObjectByKeyEvent extends APIGatewayProxyEvent {
  bucket: string;
  key: string;
}
