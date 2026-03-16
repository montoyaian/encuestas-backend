import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Env } from './env.model';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ChartsModule } from './charts/charts.module';
import { SurveysModule } from './surveys/surveys.module';
import { ResponsesModule } from './responses/responses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService<Env>) => {
        const isPostgresSslEnabled =
          configService.get('POSTGRES_SSL') === 'true';

        return {
          type: 'postgres',
          host: configService.get('POSTGRES_HOST'),
          port: Number(configService.get('POSTGRES_PORT')),
          username: configService.get('POSTGRES_USER'),
          password: configService.get('POSTGRES_PASSWORD'),
          database: configService.get('POSTGRES_DB'),
          ssl: isPostgresSslEnabled ? { rejectUnauthorized: false } : false,
          autoLoadEntities: true,
          synchronize: false,
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    SurveysModule,
    ResponsesModule,
    ChartsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
