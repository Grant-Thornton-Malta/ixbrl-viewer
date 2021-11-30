// Copyright 2021 Workiva Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Inspector } from "./inspector.js";

export function TestInspector() {
}

TestInspector.prototype = Object.create(Inspector.prototype);

expect.extend({
    toEqualDecimal(received, expected) {
        const options = {
              comment: 'decimal.js equality',
              isNot: this.isNot,
              promise: this.promise,
        };
        const pass = received.equals(expected);
        const message = () =>
              this.utils.matcherHint('toEqualDecimals', undefined, undefined, options) +
              '\n\n' +
              `Expected: ${this.isNot ? '(not) ' : ''}${this.utils.printExpected(new Decimal(expected))}\n` +
              `Received: ${this.utils.printReceived(received)}`;

        return {actual: received, message, pass};
        
    }
});
