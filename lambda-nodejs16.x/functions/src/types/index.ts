import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from 'aws-lambda'

export type APIGatewayProxyHandler = Handler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
>

export interface GetS3ObjectByKeyEvent extends APIGatewayProxyEvent {
  key?: string
}
