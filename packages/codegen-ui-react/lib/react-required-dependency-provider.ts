/*
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

  Licensed under the Apache License, Version 2.0 (the "License").
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 */
import { RequiredDependency, RequiredDependencyProvider } from '@aws-amplify/codegen-ui';

type SemVerRequiredDependency = RequiredDependency & {
  supportedSemVerPattern: string;
};

export class ReactRequiredDependencyProvider extends RequiredDependencyProvider<SemVerRequiredDependency> {
  getRequiredDependencies(hasStorageManager?: boolean): SemVerRequiredDependency[] {
    const dependencies = [
      {
        dependencyName: '@aws-amplify/ui-react',
        supportedSemVerPattern: '^4.6.0',
        reason: 'Required to leverage Amplify UI primitives, and Amplify Studio component helper functions.',
      },
      {
        dependencyName: 'aws-amplify',
        supportedSemVerPattern: '^5.0.2',
        reason: 'Required to leverage DataStore.',
      },
    ];

    if (hasStorageManager) {
      dependencies.push({
        dependencyName: '@aws-amplify/ui-react-storage',
        supportedSemVerPattern: '^1.1.0',
        reason: 'Required to leverage StorageManager.',
      });
    }

    return dependencies;
  }
}
