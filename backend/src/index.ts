import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({ origin: ENV.FRONTEND_URL }));

app.listen(ENV.PORT, () => {
  console.log(`Server is running on port ${ENV.PORT}`);
});
