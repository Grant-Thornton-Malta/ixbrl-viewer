// Copyright 2019 Workiva Inc.
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

import { Fact } from "./fact.js";
import { FactSet } from "./factset.js";
import { iXBRLReport } from "./report.js";
import './test-utils.js';

var i = 0;

var testReportData = {
    "prefixes": {
        "eg": "http://www.example.com",
        "iso4217": "http://www.xbrl.org/2003/iso4217",
        "e": "http://example.com/entity",
    },
    "concepts": {
        "eg:Concept1": {
            "labels": {
                "std": {
                    "en": "Concept 1"
                }
            }
        },
        "eg:Concept2": {
            "labels": {
                "std": {
                    "en": "Concept 2"
                }
            }
        },
        "eg:Concept3": {
            "labels": {
                "std": {
                    "en": "Concept 3"
                }
            }
        },
        "eg:Concept4": {
            "labels": {
            }
        },
        "eg:Dimension1": {
            "labels": {
                "std": {
                    "en": "Dimension 1"
                }
            }
        },
        "eg:Dimension2": {
            "labels": {
                "std": {
                    "en": "Dimension 2"
                }
            }
        },
        "eg:DimensionValue1": {
            "labels": {
                "std": {
                    "en": "Dimension Value 1"
                }
            }
        },
        "eg:DimensionValue2": {
            "labels": {
                "std": {
                    "en": "Dimension Value 2"
                }
            }
        }
    },
    "facts": {
    }
};

function testReport(facts) {
    // Deep copy of standing data
    var data = JSON.parse(JSON.stringify(testReportData));
    data.facts = facts;
    var report = new iXBRLReport(data);
    return report;
}

function testFact(aspectData) {
    var factData = { "a": aspectData };
    return factData;
}

describe("Minimally unique labels (non-dimensional)", () => {
  var report = testReport({ 
      "f1": testFact({"c": "eg:Concept1", "p": "2018-01-01"}),
      "f2": testFact({"c": "eg:Concept2", "p": "2018-01-01"}),
      "f3": testFact({"c": "eg:Concept2", "p": "2019-01-01"}),
      "f4": testFact({"c": "eg:Concept2", "p": "2019-01-01"}),
  });

  var f1 = new Fact(report, "f1");
  var f2 = new Fact(report, "f2");
  var f3 = new Fact(report, "f3");
  var f4 = new Fact(report, "f3");

  test("Different concept", () => {
    var fs = new FactSet([ f1, f2 ]);
    expect(fs._allDimensions()).toEqual([]);
    expect(fs.minimallyUniqueLabel(f1)).toEqual("Concept 1");
    expect(fs.minimallyUniqueLabel(f2)).toEqual("Concept 2");
  });

  test("Different period", () => {
    var fs = new FactSet([ f2, f3 ]);
    expect(fs._allDimensions()).toEqual([]);
    expect(fs.minimallyUniqueLabel(f2)).toEqual("31 Dec 2017");
    expect(fs.minimallyUniqueLabel(f3)).toEqual("31 Dec 2018");
  });

  test("Different concept and period, concept takes precedence", () => {
    var fs = new FactSet([ f1, f4 ]);
    expect(fs._allDimensions()).toEqual([]);
    expect(fs.minimallyUniqueLabel(f1)).toEqual("Concept 1");
    expect(fs.minimallyUniqueLabel(f4)).toEqual("Concept 2");
  });

  test("Mix of period and concept differences", () => {
    var fs = new FactSet([ f1, f2, f3 ]);
    expect(fs._allDimensions()).toEqual([]);
    expect(fs.minimallyUniqueLabel(f1)).toEqual("Concept 1, 31 Dec 2017");
    expect(fs.minimallyUniqueLabel(f2)).toEqual("Concept 2, 31 Dec 2017");
    expect(fs.minimallyUniqueLabel(f3)).toEqual("Concept 2, 31 Dec 2018");
  });
});

describe("Minimally unique labels (dimensional)", () => {
  var report = testReport({ 
      "f1": testFact({"c": "eg:Concept1", "p": "2018-01-01", "eg:Dimension1": "eg:DimensionValue1"}),
      "f2": testFact({"c": "eg:Concept1", "p": "2018-01-01", "eg:Dimension1": "eg:DimensionValue2"}),
      "f3": testFact({"c": "eg:Concept1", "p": "2019-01-01", "eg:Dimension1": "eg:DimensionValue2"}),
      "f4": testFact({"c": "eg:Concept1", "p": "2018-01-01" }),
  });

  var f1 = new Fact(report, "f1");
  var f2 = new Fact(report, "f2");
  var f3 = new Fact(report, "f3");
  var f4 = new Fact(report, "f4");

  test("Same concept & period, different dimension value", () => {
    var fs = new FactSet([ f1, f2 ]);
    expect(fs._allDimensions()).toEqual(["eg:Dimension1"]);
    expect(fs.minimallyUniqueLabel(f1)).toEqual("Dimension Value 1");
    expect(fs.minimallyUniqueLabel(f2)).toEqual("Dimension Value 2");
  });

  test("Different period, different dimension value", () => {
    var fs = new FactSet([ f1, f3 ]);
    expect(fs._allDimensions()).toEqual(["eg:Dimension1"]);
    /* Different period takes precedence */
    expect(fs.minimallyUniqueLabel(f1)).toEqual("31 Dec 2017");
    expect(fs.minimallyUniqueLabel(f3)).toEqual("31 Dec 2018");
  });

  test("Dimension present on one fact only", () => {
    var fs = new FactSet([ f1, f4 ]);
    expect(fs._allDimensions()).toEqual(["eg:Dimension1"]);
    /* Concept is included even though it's the same across all to avoid an
     * empty label */
    expect(fs.minimallyUniqueLabel(f1)).toEqual("Concept 1, Dimension Value 1");
    expect(fs.minimallyUniqueLabel(f4)).toEqual("Concept 1");
  });

});

describe("Minimally unique labels (duplicate facts)", () => {
  var report = testReport({ 
      "f1": testFact({"c": "eg:Concept1", "p": "2018-01-01", "eg:Dimension1": "eg:DimensionValue1"}),
      "f2": testFact({"c": "eg:Concept1", "p": "2018-01-01", "eg:Dimension1": "eg:DimensionValue1"}),
  });

  var f1 = new Fact(report, "f1");
  var f2 = new Fact(report, "f2");

  test("Two facts, all aspects the same", () => {
    var fs = new FactSet([ f1, f2 ]);
    expect(fs._allDimensions()).toEqual(["eg:Dimension1"]);
    expect(fs.minimallyUniqueLabel(f1)).toEqual("Concept 1");
    expect(fs.minimallyUniqueLabel(f2)).toEqual("Concept 1");
  });
});

describe("Minimally unique labels (missing labels)", () => {
  var report = testReport({ 
      "f1": testFact({"c": "eg:Concept1", "p": "2018-01-01" }),
      "f2": testFact({"c": "eg:Concept4", "p": "2018-01-01" }),
  });

  var f1 = new Fact(report, "f1");
  var f2 = new Fact(report, "f2");

  test("Two facts, one has no label", () => {
    var fs = new FactSet([ f1, f2 ]);
    expect(fs._allDimensions()).toEqual([]);
    expect(fs.minimallyUniqueLabel(f1)).toEqual("Concept 1");
    expect(fs.minimallyUniqueLabel(f2)).toEqual("eg:Concept4");
  });
});

function numericTestFact(value, decimals) {
    var factData = { "d": decimals, "v": value, "a": { "c": "eg:Concept1", "u": "eg:pure" }};
    return factData;
}

describe("Consistency", () => {
    var report = testReport({ 
        "f1": numericTestFact(150, -1), // 145-155
        "f2": numericTestFact(200, -2), // 150-250
        "f3": numericTestFact(140, -1), // 135-145
    });

    var f1 = new Fact(report, "f1");
    var f2 = new Fact(report, "f2");
    var f3 = new Fact(report, "f3");
    var f3 = new Fact(report, "f3");

    test("Inconsistent fact set", () => {
      var factSet = new FactSet([f1, f2, f3]);
      expect(factSet.valueIntersection()).toBeUndefined();
      expect(factSet.isConsistent()).toBeFalsy();
    });

    test("Consistent fact sets", () => {
      var factSet = new FactSet([f1, f2]);
      var intersection = factSet.valueIntersection();
      expect(intersection.a).toEqualDecimal(150);
      expect(intersection.b).toEqualDecimal(155);
      expect(factSet.isConsistent()).toBeTruthy();

      var factSet = new FactSet([f1, f3]);
      var intersection = factSet.valueIntersection();
      expect(intersection.a).toEqualDecimal(145);
      expect(intersection.b).toEqualDecimal(145);
      expect(factSet.isConsistent()).toBeTruthy();
    });
  
});
