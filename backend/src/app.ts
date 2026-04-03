import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config';
import { authRouter } from './routes';
import { globalErrorHandler } from './controllers';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: ENV.FRONTEND_URL, credentials: true }));

app.use('/api/v1/auth', authRouter);

app.use(globalErrorHandler);

export default app;
