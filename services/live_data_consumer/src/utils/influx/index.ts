import { Module } from '@nestjs/common';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InfluxDB, Point } from '@influxdata/influxdb-client';

@Injectable()
export class InfluxService implements OnModuleInit {
  private readonly influxUrl: string = process.env.INFLUX_URL;
  private readonly influxToken: string = process.env.INFLUX_TOKEN;
  private readonly bucket: string = process.env.INFLUX_BUCKET;
  private readonly org: string = process.env.INFLUX_ORG;
  private client: InfluxDB;
  private logger = new Logger(InfluxService.name);

  onModuleInit() {
    this.client = new InfluxDB({
      url: this.influxUrl,
      token: this.influxToken,
    });
    this.logger.log('InfluxDB client initialized');
  }

  public async writePoint(data: {
    measurement: string;
    tags: Record<string, string>;
    fields: Record<string, any>;
    timestamp?: number;
  }): Promise<void> {
    const point = new Point(data.measurement);

    for (const [key, value] of Object.entries(data.tags)) {
      point.tag(key, value);
    }

    for (const [key, value] of Object.entries(data.fields)) {
      point.floatField(key, value);
    }

    if (data.timestamp) {
      point.timestamp(new Date(data.timestamp));
    }

    try {
      const writeApi = this.client.getWriteApi(this.org, this.bucket);
      writeApi.writePoint(point);
      await writeApi.flush();
      this.logger.log(`Data written to InfluxDB: ${JSON.stringify(data)}`);
    } catch (error) {
      this.logger.error(`Error writing data to InfluxDB: ${error.message}`);
      throw error;
    }
  }
}

@Module({
  providers: [InfluxService],
  exports: [InfluxService],
})
export class InfluxModule {}
