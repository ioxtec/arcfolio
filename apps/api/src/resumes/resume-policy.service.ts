import { Injectable } from '@nestjs/common';

@Injectable()
export class ResumePolicyService {
  readonly maxDocuments = 5;
  readonly maxVersions = 10;
}
