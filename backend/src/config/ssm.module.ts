import { Global, Module } from '@nestjs/common';
import { SsmConfigService } from './ssm.config';

@Global()
@Module({
    providers: [SsmConfigService],
    exports: [SsmConfigService],
})
export class SsmModule { }
