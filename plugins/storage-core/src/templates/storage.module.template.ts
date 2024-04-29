import { Module } from "@nestjs/common";

@Module({
  providers: PROVIDERS_ARRAY,
  exports: PROVIDERS_ARRAY,
})
export class StorageModule {}
