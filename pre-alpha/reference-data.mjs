// Read-only snapshot of established dev reference tables. Source parity is tested.
export const DATA = {
  "glossary": [
    [
      "MD",
      "Measured Distance"
    ],
    [
      "LD",
      "Lost Distance"
    ],
    [
      "LI",
      "Lower In"
    ],
    [
      "PTC",
      "Pilot To Cutter"
    ],
    [
      "BCO",
      "Book Cut Out"
    ],
    [
      "CCO",
      "Coupon Cut Out"
    ],
    [
      "MCO",
      "Maximum Cut Out"
    ],
    [
      "POP",
      "Pilot On Pipe"
    ],
    [
      "COP",
      "Cutter On Pipe"
    ],
    [
      "TTD",
      "Total Travel Distance"
    ],
    [
      "TCO",
      "Total Cutout"
    ],
    [
      "MT",
      "Machine Travel"
    ],
    [
      "POD",
      "Pipe Outside Diameter"
    ],
    [
      "OD",
      "Outside Diameter"
    ],
    [
      "ID",
      "Inside Diameter"
    ],
    [
      "WT / Wall",
      "Wall Thickness"
    ],
    [
      "VB",
      "Valve Bore"
    ],
    [
      "GTF",
      "Gate To Flange"
    ],
    [
      "Valve T",
      "Valve Turns"
    ],
    [
      "Seg T",
      "Segment Turns"
    ],
    [
      "-1 Wall",
      "Minus One Wall Thickness"
    ],
    [
      "JBF",
      "Jack Bolt to Flange"
    ],
    [
      "PT",
      "Plug Thickness"
    ],
    [
      "RPM",
      "Revolutions Per Minute"
    ],
    [
      "ETA",
      "Estimated cutting time based on travel, feed, and RPM"
    ],
    [
      "Feed Rate",
      "Advance per revolution, shown in inches per revolution"
    ],
    [
      "Hot Tap",
      "Operation that cuts into the line with a pilot and cutter"
    ],
    [
      "Line Stop",
      "Operation that inserts a stopping head or inflatable stop into the line"
    ],
    [
      "Completion Plug",
      "Plug used to seal the branch after the tapping / stopping work is complete"
    ],
    [
      "FHL",
      "Folding Head Line Stop"
    ],
    [
      "Coupon",
      "The cutout removed by the cutter during a hot tap"
    ],
    [
      "Plant Series",
      "Reference chart for jack-bolt wrench size, packing nut wrench size, and jack-bolt count"
    ],
    [
      "HTM",
      "Hot Tap Machine stack-up reference"
    ],
    [
      "LSM",
      "Line Stop Machine stack-up reference"
    ],
    [
      "Stack-Up",
      "Machine setup/reference document used to confirm the physical arrangement"
    ],
    [
      "IP Manual",
      "Uploaded tapping-machine manual reference"
    ],
    [
      "MA140",
      "Line stop machine family listed in the uploaded stack-up references"
    ]
  ],
  "cutters": {
    "floStopHotTap": {
      "label": "FloStop II / IP-412 Hot Tap",
      "rows": [
        [
          "4",
          "3.438"
        ],
        [
          "6",
          "5.468"
        ],
        [
          "8",
          "7.312"
        ],
        [
          "10",
          "9.5"
        ],
        [
          "12",
          "11.5"
        ]
      ]
    },
    "floStopLineStop": {
      "label": "FloStop II / IP-412 Line Stop",
      "rows": [
        [
          "4",
          "3.8"
        ],
        [
          "6",
          "5.8"
        ],
        [
          "8",
          "7.9"
        ],
        [
          "10",
          "9.8"
        ],
        [
          "12",
          "11.8"
        ]
      ]
    },
    "hotTap": {
      "label": "Standard Hot Tap",
      "rows": [
        [
          "3",
          "2.438"
        ],
        [
          "4",
          "2.438"
        ],
        [
          "6",
          "5.469"
        ],
        [
          "8",
          "7.313"
        ],
        [
          "10",
          "9.500"
        ],
        [
          "12",
          "11.500"
        ],
        [
          "14",
          "12.750"
        ],
        [
          "16",
          "14.688"
        ],
        [
          "18",
          "15.063"
        ],
        [
          "20",
          "17.000"
        ],
        [
          "22",
          "19.000"
        ],
        [
          "24",
          "21.000"
        ],
        [
          "26",
          "23.000"
        ],
        [
          "28",
          "25.000"
        ],
        [
          "30",
          "27.000"
        ],
        [
          "36",
          "33.000"
        ],
        [
          "42",
          "39.000"
        ]
      ]
    },
    "lineStop": {
      "label": "Line Stop",
      "rows": [
        [
          "3",
          "2.938"
        ],
        [
          "4",
          "3.938"
        ],
        [
          "6",
          "5.938"
        ],
        [
          "8",
          "7.875"
        ],
        [
          "10",
          "9.875"
        ],
        [
          "12",
          "11.813"
        ],
        [
          "14",
          "13.063"
        ],
        [
          "16",
          "15.063"
        ],
        [
          "18",
          "17.000"
        ],
        [
          "20",
          "19.000"
        ],
        [
          "22",
          "21.000"
        ],
        [
          "24",
          "23.000"
        ],
        [
          "26",
          "25.000"
        ],
        [
          "28",
          "27.000"
        ],
        [
          "30",
          "29.000"
        ],
        [
          "36",
          "35.000"
        ]
      ]
    }
  },
  "rpm": {
    "360": {
      "2": [
        35,
        45
      ],
      "3": [
        35,
        45
      ],
      "4": [
        35,
        45
      ],
      "6": [
        35
      ]
    },
    "660": {
      "3": [
        37
      ],
      "4": [
        37
      ],
      "6": [
        37
      ],
      "8": [
        37
      ],
      "10": [
        37
      ],
      "12": [
        33
      ],
      "14": [
        30
      ]
    },
    "1200": {
      "12": [
        25,
        26,
        27
      ],
      "14": [
        23,
        24,
        25
      ],
      "16": [
        21,
        22,
        23
      ],
      "18": [
        19,
        20,
        21
      ],
      "20": [
        17,
        18,
        19
      ],
      "22": [
        16,
        17,
        18
      ],
      "24": [
        14,
        15,
        16
      ],
      "26": [
        12,
        13,
        14
      ],
      "28": [
        12,
        13,
        14
      ],
      "30": [
        12,
        13,
        14
      ],
      "34": [
        12,
        13,
        14
      ],
      "36": [
        12,
        13,
        14
      ],
      "38": [
        12,
        13,
        14
      ],
      "40": [
        12,
        13,
        14
      ]
    }
  },
  "bolting": {
    "150": {
      "type": "dual",
      "rows": [
        {
          "size": "1/2",
          "bolts": "4",
          "diameter": "0.50",
          "stud_rf": "2-1/2",
          "stud_rtj": "-",
          "wrench": "7/8"
        },
        {
          "size": "3/4",
          "bolts": "4",
          "diameter": "0.50",
          "stud_rf": "2-1/2",
          "stud_rtj": "-",
          "wrench": "7/8"
        },
        {
          "size": "1",
          "bolts": "4",
          "diameter": "0.50",
          "stud_rf": "2-3/4",
          "stud_rtj": "3-1/4",
          "wrench": "7/8"
        },
        {
          "size": "1-1/4",
          "bolts": "4",
          "diameter": "0.50",
          "stud_rf": "2-3/4",
          "stud_rtj": "3-1/4",
          "wrench": "7/8"
        },
        {
          "size": "1-1/2",
          "bolts": "4",
          "diameter": "0.50",
          "stud_rf": "3",
          "stud_rtj": "3-1/2",
          "wrench": "7/8"
        },
        {
          "size": "2",
          "bolts": "4",
          "diameter": "0.62",
          "stud_rf": "3-1/4",
          "stud_rtj": "3-3/4",
          "wrench": "1-1/16"
        },
        {
          "size": "2-1/2",
          "bolts": "4",
          "diameter": "0.62",
          "stud_rf": "3-1/2",
          "stud_rtj": "4",
          "wrench": "1-1/16"
        },
        {
          "size": "3",
          "bolts": "4",
          "diameter": "0.62",
          "stud_rf": "3-3/4",
          "stud_rtj": "4-1/4",
          "wrench": "1-1/16"
        },
        {
          "size": "3-1/2",
          "bolts": "8",
          "diameter": "0.62",
          "stud_rf": "3-3/4",
          "stud_rtj": "4-1/4",
          "wrench": "1-1/16"
        },
        {
          "size": "4",
          "bolts": "8",
          "diameter": "0.62",
          "stud_rf": "3-3/4",
          "stud_rtj": "4-1/4",
          "wrench": "1-1/16"
        },
        {
          "size": "5",
          "bolts": "8",
          "diameter": "0.75",
          "stud_rf": "4",
          "stud_rtj": "4-1/2",
          "wrench": "1-1/4"
        },
        {
          "size": "6",
          "bolts": "8",
          "diameter": "0.75",
          "stud_rf": "4",
          "stud_rtj": "4-1/2",
          "wrench": "1-1/4"
        },
        {
          "size": "8",
          "bolts": "8",
          "diameter": "0.75",
          "stud_rf": "4-1/4",
          "stud_rtj": "4-1/2",
          "wrench": "1-1/4"
        },
        {
          "size": "10",
          "bolts": "12",
          "diameter": "0.88",
          "stud_rf": "4-3/4",
          "stud_rtj": "5-1/4",
          "wrench": "1-7/16"
        },
        {
          "size": "12",
          "bolts": "12",
          "diameter": "0.88",
          "stud_rf": "4-3/4",
          "stud_rtj": "5-1/4",
          "wrench": "1-7/16"
        },
        {
          "size": "14",
          "bolts": "12",
          "diameter": "1.00",
          "stud_rf": "5-1/4",
          "stud_rtj": "5-3/4",
          "wrench": "1-5/8"
        },
        {
          "size": "16",
          "bolts": "16",
          "diameter": "1.00",
          "stud_rf": "5-1/2",
          "stud_rtj": "6",
          "wrench": "1-5/8"
        },
        {
          "size": "18",
          "bolts": "16",
          "diameter": "1.12",
          "stud_rf": "6",
          "stud_rtj": "6-1/2",
          "wrench": "1-13/16"
        },
        {
          "size": "20",
          "bolts": "20",
          "diameter": "1.12",
          "stud_rf": "6-1/4",
          "stud_rtj": "6-3/4",
          "wrench": "1-13/16"
        },
        {
          "size": "24",
          "bolts": "20",
          "diameter": "1.25",
          "stud_rf": "7",
          "stud_rtj": "7-1/2",
          "wrench": "2"
        },
        {
          "size": "26",
          "bolts": "24",
          "diameter": "1.38",
          "stud_rf": "8-3/4",
          "stud_rtj": "-",
          "wrench": "2-3/16"
        },
        {
          "size": "28",
          "bolts": "28",
          "diameter": "1.38",
          "stud_rf": "9",
          "stud_rtj": "-",
          "wrench": "2-3/16"
        },
        {
          "size": "30",
          "bolts": "28",
          "diameter": "1.38",
          "stud_rf": "9-1/4",
          "stud_rtj": "-",
          "wrench": "2-3/16"
        },
        {
          "size": "32",
          "bolts": "28",
          "diameter": "1.62",
          "stud_rf": "10-1/2",
          "stud_rtj": "-",
          "wrench": "2-9/16"
        },
        {
          "size": "34",
          "bolts": "32",
          "diameter": "1.62",
          "stud_rf": "10-1/2",
          "stud_rtj": "-",
          "wrench": "2-9/16"
        },
        {
          "size": "36",
          "bolts": "32",
          "diameter": "1.62",
          "stud_rf": "11",
          "stud_rtj": "-",
          "wrench": "2-9/16"
        },
        {
          "size": "38",
          "bolts": "32",
          "diameter": "1.62",
          "stud_rf": "11",
          "stud_rtj": "-",
          "wrench": "2-9/16"
        },
        {
          "size": "40",
          "bolts": "36",
          "diameter": "1.62",
          "stud_rf": "11",
          "stud_rtj": "-",
          "wrench": "2-9/16"
        },
        {
          "size": "42",
          "bolts": "36",
          "diameter": "1.62",
          "stud_rf": "11-1/2",
          "stud_rtj": "-",
          "wrench": "2-9/16"
        },
        {
          "size": "44",
          "bolts": "40",
          "diameter": "1.62",
          "stud_rf": "12",
          "stud_rtj": "-",
          "wrench": "2-9/16"
        },
        {
          "size": "46",
          "bolts": "40",
          "diameter": "1.62",
          "stud_rf": "12",
          "stud_rtj": "-",
          "wrench": "2-9/16"
        },
        {
          "size": "48",
          "bolts": "44",
          "diameter": "1.62",
          "stud_rf": "12-1/2",
          "stud_rtj": "-",
          "wrench": "2-9/16"
        }
      ]
    },
    "300": {
      "type": "dual",
      "rows": [
        {
          "size": "1/2",
          "bolts": "4",
          "diameter": "0.50",
          "stud_rf": "2-3/4",
          "stud_rtj": "3-1/4",
          "wrench": "7/8"
        },
        {
          "size": "3/4",
          "bolts": "4",
          "diameter": "0.62",
          "stud_rf": "3",
          "stud_rtj": "3-1/2",
          "wrench": "1-1/16"
        },
        {
          "size": "1",
          "bolts": "4",
          "diameter": "0.62",
          "stud_rf": "3-1/4",
          "stud_rtj": "3-3/4",
          "wrench": "1-1/16"
        },
        {
          "size": "1-1/4",
          "bolts": "4",
          "diameter": "0.62",
          "stud_rf": "3-1/4",
          "stud_rtj": "3-3/4",
          "wrench": "1-1/16"
        },
        {
          "size": "1-1/2",
          "bolts": "4",
          "diameter": "0.75",
          "stud_rf": "3-3/4",
          "stud_rtj": "4-1/4",
          "wrench": "1-1/4"
        },
        {
          "size": "2",
          "bolts": "8",
          "diameter": "0.62",
          "stud_rf": "3-1/2",
          "stud_rtj": "4-1/4",
          "wrench": "1-1/16"
        },
        {
          "size": "2-1/2",
          "bolts": "8",
          "diameter": "0.75",
          "stud_rf": "4",
          "stud_rtj": "4-3/4",
          "wrench": "1-1/4"
        },
        {
          "size": "3",
          "bolts": "8",
          "diameter": "0.75",
          "stud_rf": "4-1/4",
          "stud_rtj": "5",
          "wrench": "1-1/4"
        },
        {
          "size": "3-1/2",
          "bolts": "8",
          "diameter": "0.75",
          "stud_rf": "4-1/2",
          "stud_rtj": "5-1/4",
          "wrench": "1-1/4"
        },
        {
          "size": "4",
          "bolts": "8",
          "diameter": "0.75",
          "stud_rf": "4-1/2",
          "stud_rtj": "5-1/4",
          "wrench": "1-1/4"
        },
        {
          "size": "5",
          "bolts": "8",
          "diameter": "0.75",
          "stud_rf": "4-3/4",
          "stud_rtj": "5-1/2",
          "wrench": "1-1/4"
        },
        {
          "size": "6",
          "bolts": "12",
          "diameter": "0.75",
          "stud_rf": "5",
          "stud_rtj": "5-3/4",
          "wrench": "1-1/4"
        },
        {
          "size": "8",
          "bolts": "12",
          "diameter": "0.88",
          "stud_rf": "5-1/2",
          "stud_rtj": "6-1/4",
          "wrench": "1-7/16"
        },
        {
          "size": "10",
          "bolts": "16",
          "diameter": "1.00",
          "stud_rf": "6-1/4",
          "stud_rtj": "7",
          "wrench": "1-5/8"
        },
        {
          "size": "12",
          "bolts": "16",
          "diameter": "1.12",
          "stud_rf": "6-3/4",
          "stud_rtj": "7-1/2",
          "wrench": "1-13/16"
        },
        {
          "size": "14",
          "bolts": "20",
          "diameter": "1.12",
          "stud_rf": "7",
          "stud_rtj": "7-3/4",
          "wrench": "1-13/16"
        },
        {
          "size": "16",
          "bolts": "20",
          "diameter": "1.25",
          "stud_rf": "7-1/2",
          "stud_rtj": "8-1/4",
          "wrench": "2"
        },
        {
          "size": "18",
          "bolts": "24",
          "diameter": "1.25",
          "stud_rf": "7-3/4",
          "stud_rtj": "8-1/2",
          "wrench": "2"
        },
        {
          "size": "20",
          "bolts": "24",
          "diameter": "1.25",
          "stud_rf": "8-1/4",
          "stud_rtj": "9",
          "wrench": "2"
        },
        {
          "size": "24",
          "bolts": "24",
          "diameter": "1.50",
          "stud_rf": "9-1/4",
          "stud_rtj": "10-1/4",
          "wrench": "2-3/8"
        },
        {
          "size": "26",
          "bolts": "28",
          "diameter": "1.75",
          "stud_rf": "10-3/4",
          "stud_rtj": "-",
          "wrench": "2-3/4"
        },
        {
          "size": "28",
          "bolts": "28",
          "diameter": "1.75",
          "stud_rf": "11-1/4",
          "stud_rtj": "-",
          "wrench": "2-3/4"
        },
        {
          "size": "30",
          "bolts": "28",
          "diameter": "1.88",
          "stud_rf": "12",
          "stud_rtj": "-",
          "wrench": "2-15/16"
        },
        {
          "size": "32",
          "bolts": "28",
          "diameter": "2.00",
          "stud_rf": "12-1/2",
          "stud_rtj": "-",
          "wrench": "3-1/8"
        },
        {
          "size": "34",
          "bolts": "28",
          "diameter": "2.00",
          "stud_rf": "13",
          "stud_rtj": "-",
          "wrench": "3-1/8"
        },
        {
          "size": "36",
          "bolts": "32",
          "diameter": "2.12",
          "stud_rf": "13-1/2",
          "stud_rtj": "-",
          "wrench": "3-1/4"
        },
        {
          "size": "38",
          "bolts": "32",
          "diameter": "1.62",
          "stud_rf": "12-1/2",
          "stud_rtj": "-",
          "wrench": "2-9/16"
        },
        {
          "size": "40",
          "bolts": "32",
          "diameter": "1.75",
          "stud_rf": "13-1/4",
          "stud_rtj": "-",
          "wrench": "2-3/4"
        },
        {
          "size": "42",
          "bolts": "32",
          "diameter": "1.75",
          "stud_rf": "13-3/4",
          "stud_rtj": "-",
          "wrench": "2-3/4"
        },
        {
          "size": "44",
          "bolts": "32",
          "diameter": "1.88",
          "stud_rf": "14-1/4",
          "stud_rtj": "-",
          "wrench": "2-15/16"
        },
        {
          "size": "46",
          "bolts": "28",
          "diameter": "2.00",
          "stud_rf": "15",
          "stud_rtj": "-",
          "wrench": "3-1/8"
        },
        {
          "size": "48",
          "bolts": "32",
          "diameter": "2.00",
          "stud_rf": "15-1/4",
          "stud_rtj": "-",
          "wrench": "3-1/8"
        }
      ]
    },
    "400": {
      "type": "single",
      "rows": [
        {
          "size": "1/2",
          "bolts": "4",
          "diameter": "0.50",
          "stud": "3-1/4",
          "wrench": "7/8"
        },
        {
          "size": "3/4",
          "bolts": "4",
          "diameter": "0.63",
          "stud": "3-1/2",
          "wrench": "1-1/16"
        },
        {
          "size": "1",
          "bolts": "4",
          "diameter": "0.63",
          "stud": "3-3/4",
          "wrench": "1-1/16"
        },
        {
          "size": "1-1/4",
          "bolts": "4",
          "diameter": "0.63",
          "stud": "4",
          "wrench": "1-1/16"
        },
        {
          "size": "1-1/2",
          "bolts": "4",
          "diameter": "0.75",
          "stud": "4-1/4",
          "wrench": "1-1/4"
        },
        {
          "size": "2",
          "bolts": "8",
          "diameter": "0.63",
          "stud": "4-1/4",
          "wrench": "1-1/16"
        },
        {
          "size": "2-1/2",
          "bolts": "8",
          "diameter": "0.75",
          "stud": "4-3/4",
          "wrench": "1-1/4"
        },
        {
          "size": "3",
          "bolts": "8",
          "diameter": "0.75",
          "stud": "5",
          "wrench": "1-1/4"
        },
        {
          "size": "3-1/2",
          "bolts": "8",
          "diameter": "0.88",
          "stud": "5-1/2",
          "wrench": "1-7/16"
        },
        {
          "size": "4",
          "bolts": "8",
          "diameter": "0.88",
          "stud": "5-1/2",
          "wrench": "1-7/16"
        },
        {
          "size": "5",
          "bolts": "8",
          "diameter": "0.88",
          "stud": "5-3/4",
          "wrench": "1-7/16"
        },
        {
          "size": "6",
          "bolts": "12",
          "diameter": "0.88",
          "stud": "6",
          "wrench": "1-7/16"
        },
        {
          "size": "8",
          "bolts": "12",
          "diameter": "1.00",
          "stud": "6-3/4",
          "wrench": "1-5/8"
        },
        {
          "size": "10",
          "bolts": "16",
          "diameter": "1.13",
          "stud": "7-1/2",
          "wrench": "1-13/16"
        },
        {
          "size": "12",
          "bolts": "16",
          "diameter": "1.25",
          "stud": "8",
          "wrench": "2"
        },
        {
          "size": "14",
          "bolts": "20",
          "diameter": "1.25",
          "stud": "8-1/4",
          "wrench": "2"
        },
        {
          "size": "16",
          "bolts": "20",
          "diameter": "1.38",
          "stud": "8-3/4",
          "wrench": "2-3/16"
        },
        {
          "size": "18",
          "bolts": "24",
          "diameter": "1.38",
          "stud": "9",
          "wrench": "2-3/16"
        },
        {
          "size": "20",
          "bolts": "24",
          "diameter": "1.50",
          "stud": "9-3/4",
          "wrench": "2-3/8"
        },
        {
          "size": "24",
          "bolts": "24",
          "diameter": "1.75",
          "stud": "10-3/4",
          "wrench": "2-3/4"
        },
        {
          "size": "26",
          "bolts": "28",
          "diameter": "1.88",
          "stud": "12-1/2",
          "wrench": "2-15/16"
        },
        {
          "size": "28",
          "bolts": "28",
          "diameter": "2.00",
          "stud": "13-1/4",
          "wrench": "3-1/8"
        },
        {
          "size": "30",
          "bolts": "28",
          "diameter": "2.12",
          "stud": "14",
          "wrench": "3-1/4"
        },
        {
          "size": "32",
          "bolts": "28",
          "diameter": "2.12",
          "stud": "14-1/4",
          "wrench": "3-1/4"
        },
        {
          "size": "34",
          "bolts": "28",
          "diameter": "2.12",
          "stud": "14-3/4",
          "wrench": "3-1/4"
        },
        {
          "size": "36",
          "bolts": "32",
          "diameter": "2.12",
          "stud": "15",
          "wrench": "3-1/4"
        },
        {
          "size": "38",
          "bolts": "32",
          "diameter": "1.88",
          "stud": "14-3/4",
          "wrench": "2-15/16"
        },
        {
          "size": "40",
          "bolts": "32",
          "diameter": "2.00",
          "stud": "15-1/2",
          "wrench": "3-1/8"
        },
        {
          "size": "42",
          "bolts": "32",
          "diameter": "2.00",
          "stud": "15-3/4",
          "wrench": "3-1/8"
        },
        {
          "size": "44",
          "bolts": "32",
          "diameter": "2.12",
          "stud": "16-1/2",
          "wrench": "3-1/4"
        },
        {
          "size": "46",
          "bolts": "36",
          "diameter": "2.12",
          "stud": "17",
          "wrench": "3-1/4"
        },
        {
          "size": "48",
          "bolts": "28",
          "diameter": "2.38",
          "stud": "18",
          "wrench": "3-5/8"
        }
      ]
    },
    "600": {
      "type": "single",
      "rows": [
        {
          "size": "1/2",
          "bolts": "4",
          "diameter": "0.50",
          "stud": "3-1/4",
          "wrench": "7/8"
        },
        {
          "size": "3/4",
          "bolts": "4",
          "diameter": "0.63",
          "stud": "3-1/2",
          "wrench": "1-1/16"
        },
        {
          "size": "1",
          "bolts": "4",
          "diameter": "0.63",
          "stud": "3-3/4",
          "wrench": "1-1/16"
        },
        {
          "size": "1-1/4",
          "bolts": "4",
          "diameter": "0.63",
          "stud": "4",
          "wrench": "1-1/16"
        },
        {
          "size": "1-1/2",
          "bolts": "4",
          "diameter": "0.75",
          "stud": "4-1/4",
          "wrench": "1-1/4"
        },
        {
          "size": "2",
          "bolts": "8",
          "diameter": "0.63",
          "stud": "4-1/4",
          "wrench": "1-1/16"
        },
        {
          "size": "2-1/2",
          "bolts": "8",
          "diameter": "0.75",
          "stud": "4-3/4",
          "wrench": "1-1/4"
        },
        {
          "size": "3",
          "bolts": "8",
          "diameter": "0.75",
          "stud": "5",
          "wrench": "1-1/4"
        },
        {
          "size": "3-1/2",
          "bolts": "8",
          "diameter": "0.88",
          "stud": "5-1/2",
          "wrench": "1-7/16"
        },
        {
          "size": "4",
          "bolts": "8",
          "diameter": "0.88",
          "stud": "5-3/4",
          "wrench": "1-7/16"
        },
        {
          "size": "5",
          "bolts": "8",
          "diameter": "1.00",
          "stud": "6-1/2",
          "wrench": "1-5/8"
        },
        {
          "size": "6",
          "bolts": "12",
          "diameter": "1.00",
          "stud": "6-3/4",
          "wrench": "1-5/8"
        },
        {
          "size": "8",
          "bolts": "12",
          "diameter": "1.13",
          "stud": "7-3/4",
          "wrench": "1-13/16"
        },
        {
          "size": "10",
          "bolts": "16",
          "diameter": "1.25",
          "stud": "8-1/2",
          "wrench": "2"
        },
        {
          "size": "12",
          "bolts": "20",
          "diameter": "1.25",
          "stud": "8-3/4",
          "wrench": "2"
        },
        {
          "size": "14",
          "bolts": "20",
          "diameter": "1.38",
          "stud": "9-1/4",
          "wrench": "2-3/16"
        },
        {
          "size": "16",
          "bolts": "20",
          "diameter": "1.50",
          "stud": "10",
          "wrench": "2-3/8"
        },
        {
          "size": "18",
          "bolts": "20",
          "diameter": "1.63",
          "stud": "10-3/4",
          "wrench": "2-9/16"
        },
        {
          "size": "20",
          "bolts": "24",
          "diameter": "1.63",
          "stud": "11-1/2",
          "wrench": "2-9/16"
        },
        {
          "size": "24",
          "bolts": "24",
          "diameter": "1.88",
          "stud": "13",
          "wrench": "2-15/16"
        },
        {
          "size": "26",
          "bolts": "28",
          "diameter": "2.00",
          "stud": "14-1/2",
          "wrench": "3-1/8"
        },
        {
          "size": "28",
          "bolts": "28",
          "diameter": "2.12",
          "stud": "15",
          "wrench": "3-1/4"
        },
        {
          "size": "30",
          "bolts": "28",
          "diameter": "2.12",
          "stud": "15-1/2",
          "wrench": "3-1/4"
        },
        {
          "size": "32",
          "bolts": "28",
          "diameter": "2.38",
          "stud": "16-1/2",
          "wrench": "3-5/8"
        },
        {
          "size": "34",
          "bolts": "28",
          "diameter": "2.38",
          "stud": "16-3/4",
          "wrench": "3-5/8"
        },
        {
          "size": "36",
          "bolts": "28",
          "diameter": "2.62",
          "stud": "17-3/4",
          "wrench": "4"
        },
        {
          "size": "38",
          "bolts": "28",
          "diameter": "2.38",
          "stud": "18-1/4",
          "wrench": "3-5/8"
        },
        {
          "size": "40",
          "bolts": "32",
          "diameter": "2.38",
          "stud": "18-3/4",
          "wrench": "3-5/8"
        },
        {
          "size": "42",
          "bolts": "28",
          "diameter": "2.62",
          "stud": "19-3/4",
          "wrench": "4"
        },
        {
          "size": "44",
          "bolts": "32",
          "diameter": "2.62",
          "stud": "20-1/4",
          "wrench": "4"
        },
        {
          "size": "46",
          "bolts": "32",
          "diameter": "2.62",
          "stud": "20-3/4",
          "wrench": "4"
        },
        {
          "size": "48",
          "bolts": "32",
          "diameter": "2.88",
          "stud": "22-1/4",
          "wrench": "—"
        }
      ]
    },
    "900": {
      "type": "single",
      "rows": [
        {
          "size": "1/2",
          "bolts": "4",
          "diameter": "0.75",
          "stud": "4-1/4",
          "wrench": "1-1/4"
        },
        {
          "size": "3/4",
          "bolts": "4",
          "diameter": "0.75",
          "stud": "4-1/2",
          "wrench": "1-1/4"
        },
        {
          "size": "1",
          "bolts": "4",
          "diameter": "0.88",
          "stud": "5",
          "wrench": "1-7/16"
        },
        {
          "size": "1-1/4",
          "bolts": "4",
          "diameter": "0.88",
          "stud": "5",
          "wrench": "1-7/16"
        },
        {
          "size": "1-1/2",
          "bolts": "4",
          "diameter": "1.00",
          "stud": "5-1/2",
          "wrench": "1-5/8"
        },
        {
          "size": "2",
          "bolts": "8",
          "diameter": "0.88",
          "stud": "5-3/4",
          "wrench": "1-7/16"
        },
        {
          "size": "2-1/2",
          "bolts": "8",
          "diameter": "1.00",
          "stud": "6-1/4",
          "wrench": "1-5/8"
        },
        {
          "size": "3",
          "bolts": "8",
          "diameter": "0.88",
          "stud": "5-3/4",
          "wrench": "1-7/16"
        },
        {
          "size": "3-1/2",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "4",
          "bolts": "8",
          "diameter": "1.13",
          "stud": "6-3/4",
          "wrench": "1-13/16"
        },
        {
          "size": "5",
          "bolts": "8",
          "diameter": "1.25",
          "stud": "7-1/2",
          "wrench": "2"
        },
        {
          "size": "6",
          "bolts": "12",
          "diameter": "1.13",
          "stud": "7-3/4",
          "wrench": "1-13/16"
        },
        {
          "size": "8",
          "bolts": "12",
          "diameter": "1.38",
          "stud": "8-3/4",
          "wrench": "2-3/16"
        },
        {
          "size": "10",
          "bolts": "16",
          "diameter": "1.38",
          "stud": "9-1/4",
          "wrench": "2-3/16"
        },
        {
          "size": "12",
          "bolts": "20",
          "diameter": "1.38",
          "stud": "10",
          "wrench": "2-3/16"
        },
        {
          "size": "14",
          "bolts": "20",
          "diameter": "1.50",
          "stud": "10-3/4",
          "wrench": "2-3/8"
        },
        {
          "size": "16",
          "bolts": "20",
          "diameter": "1.63",
          "stud": "11-1/4",
          "wrench": "2-9/16"
        },
        {
          "size": "18",
          "bolts": "20",
          "diameter": "1.88",
          "stud": "13",
          "wrench": "2-15/16"
        },
        {
          "size": "20",
          "bolts": "20",
          "diameter": "2.00",
          "stud": "13-3/4",
          "wrench": "3-1/8"
        },
        {
          "size": "24",
          "bolts": "20",
          "diameter": "2.50",
          "stud": "17-1/4",
          "wrench": "3-7/8"
        },
        {
          "size": "26",
          "bolts": "20",
          "diameter": "2.88",
          "stud": "18-3/4",
          "wrench": "—"
        },
        {
          "size": "28",
          "bolts": "20",
          "diameter": "3.12",
          "stud": "19-3/4",
          "wrench": "4-7/8"
        },
        {
          "size": "30",
          "bolts": "20",
          "diameter": "3.12",
          "stud": "20-1/2",
          "wrench": "4-7/8"
        },
        {
          "size": "32",
          "bolts": "20",
          "diameter": "3.38",
          "stud": "22",
          "wrench": "—"
        },
        {
          "size": "34",
          "bolts": "20",
          "diameter": "3.62",
          "stud": "23",
          "wrench": "5-1/2"
        },
        {
          "size": "36",
          "bolts": "20",
          "diameter": "3.62",
          "stud": "23-3/4",
          "wrench": "5-1/2"
        },
        {
          "size": "38",
          "bolts": "20",
          "diameter": "3.62",
          "stud": "24-1/2",
          "wrench": "5-1/2"
        },
        {
          "size": "40",
          "bolts": "24",
          "diameter": "3.62",
          "stud": "25",
          "wrench": "5-1/2"
        },
        {
          "size": "42",
          "bolts": "24",
          "diameter": "3.62",
          "stud": "25-3/4",
          "wrench": "5-1/2"
        },
        {
          "size": "44",
          "bolts": "24",
          "diameter": "3.88",
          "stud": "27",
          "wrench": "—"
        },
        {
          "size": "46",
          "bolts": "24",
          "diameter": "4.12",
          "stud": "28-1/2",
          "wrench": "6-1/4"
        },
        {
          "size": "48",
          "bolts": "24",
          "diameter": "4.12",
          "stud": "29",
          "wrench": "6-1/4"
        }
      ]
    },
    "1500": {
      "type": "single",
      "rows": [
        {
          "size": "1/2",
          "bolts": "4",
          "diameter": "0.75",
          "stud": "4-1/4",
          "wrench": "1-1/4"
        },
        {
          "size": "3/4",
          "bolts": "4",
          "diameter": "0.75",
          "stud": "4-1/2",
          "wrench": "1-1/4"
        },
        {
          "size": "1",
          "bolts": "4",
          "diameter": "0.88",
          "stud": "5",
          "wrench": "1-7/16"
        },
        {
          "size": "1-1/4",
          "bolts": "4",
          "diameter": "-",
          "stud": "5",
          "wrench": "—"
        },
        {
          "size": "1-1/2",
          "bolts": "4",
          "diameter": "1.00",
          "stud": "5-1/2",
          "wrench": "1-5/8"
        },
        {
          "size": "2",
          "bolts": "8",
          "diameter": "0.88",
          "stud": "5-3/4",
          "wrench": "1-7/16"
        },
        {
          "size": "2-1/2",
          "bolts": "8",
          "diameter": "1.00",
          "stud": "6-1/4",
          "wrench": "1-5/8"
        },
        {
          "size": "3",
          "bolts": "8",
          "diameter": "1.13",
          "stud": "7",
          "wrench": "1-13/16"
        },
        {
          "size": "3-1/2",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "4",
          "bolts": "8",
          "diameter": "1.25",
          "stud": "7-3/4",
          "wrench": "2"
        },
        {
          "size": "5",
          "bolts": "8",
          "diameter": "1.50",
          "stud": "9-3/4",
          "wrench": "2-3/8"
        },
        {
          "size": "6",
          "bolts": "12",
          "diameter": "1.38",
          "stud": "10-1/4",
          "wrench": "2-3/16"
        },
        {
          "size": "8",
          "bolts": "12",
          "diameter": "1.63",
          "stud": "11-1/2",
          "wrench": "2-9/16"
        },
        {
          "size": "10",
          "bolts": "12",
          "diameter": "1.88",
          "stud": "13-1/2",
          "wrench": "2-15/16"
        },
        {
          "size": "12",
          "bolts": "12",
          "diameter": "2.00",
          "stud": "15",
          "wrench": "3-1/8"
        },
        {
          "size": "14",
          "bolts": "16",
          "diameter": "2.25",
          "stud": "16-1/4",
          "wrench": "3-1/2"
        },
        {
          "size": "16",
          "bolts": "16",
          "diameter": "2.50",
          "stud": "17-3/4",
          "wrench": "3-7/8"
        },
        {
          "size": "18",
          "bolts": "16",
          "diameter": "2.75",
          "stud": "19-1/2",
          "wrench": "4-1/4"
        },
        {
          "size": "20",
          "bolts": "16",
          "diameter": "3.00",
          "stud": "21-1/4",
          "wrench": "4-5/8"
        },
        {
          "size": "24",
          "bolts": "16",
          "diameter": "3.50",
          "stud": "24-1/4",
          "wrench": "5-3/8"
        },
        {
          "size": "26",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "28",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "30",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "32",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "34",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "36",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "38",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "40",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "42",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "44",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "46",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "48",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        }
      ]
    },
    "2500": {
      "type": "single",
      "rows": [
        {
          "size": "1/2",
          "bolts": "4",
          "diameter": "0.75",
          "stud": "5",
          "wrench": "1-1/4"
        },
        {
          "size": "3/4",
          "bolts": "4",
          "diameter": "0.75",
          "stud": "5",
          "wrench": "1-1/4"
        },
        {
          "size": "1",
          "bolts": "4",
          "diameter": "0.88",
          "stud": "5-1/2",
          "wrench": "1-7/16"
        },
        {
          "size": "1-1/4",
          "bolts": "4",
          "diameter": "1.00",
          "stud": "6",
          "wrench": "1-5/8"
        },
        {
          "size": "1-1/2",
          "bolts": "4",
          "diameter": "1.13",
          "stud": "6-3/4",
          "wrench": "1-13/16"
        },
        {
          "size": "2",
          "bolts": "8",
          "diameter": "1.00",
          "stud": "7",
          "wrench": "1-5/8"
        },
        {
          "size": "2-1/2",
          "bolts": "8",
          "diameter": "1.13",
          "stud": "7-3/4",
          "wrench": "1-13/16"
        },
        {
          "size": "3",
          "bolts": "8",
          "diameter": "1.25",
          "stud": "8-3/4",
          "wrench": "2"
        },
        {
          "size": "3-1/2",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "4",
          "bolts": "8",
          "diameter": "1.50",
          "stud": "10",
          "wrench": "2-3/8"
        },
        {
          "size": "5",
          "bolts": "8",
          "diameter": "1.75",
          "stud": "11-3/4",
          "wrench": "2-3/4"
        },
        {
          "size": "6",
          "bolts": "8",
          "diameter": "2.00",
          "stud": "13-3/4",
          "wrench": "3-1/8"
        },
        {
          "size": "8",
          "bolts": "12",
          "diameter": "2.00",
          "stud": "15-1/4",
          "wrench": "3-1/8"
        },
        {
          "size": "10",
          "bolts": "12",
          "diameter": "2.50",
          "stud": "19-1/4",
          "wrench": "3-7/8"
        },
        {
          "size": "12",
          "bolts": "12",
          "diameter": "2.75",
          "stud": "21-1/4",
          "wrench": "4-1/4"
        },
        {
          "size": "14",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "16",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "18",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "20",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "24",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "26",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "28",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "30",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "32",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "34",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "36",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "38",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "40",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "42",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "44",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "46",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        },
        {
          "size": "48",
          "bolts": "-",
          "diameter": "-",
          "stud": "-",
          "wrench": "—"
        }
      ]
    }
  },
  "htp": {
    "3": {
      "branch": "6\"",
      "head": "3\" - 4\"",
      "cutter": 5.5,
      "bco": 3
    },
    "4": {
      "branch": "6\" - 8\"",
      "head": "4\" - 6\"",
      "cutter": 7.468,
      "bco": 4
    },
    "6": {
      "branch": "8\" - 12\"",
      "head": "6\" - 8\"",
      "cutter": 9.968,
      "bco": 6
    },
    "8": {
      "branch": "12\"",
      "head": "6\" - 8\"",
      "cutter": 9.968,
      "bco": 8
    },
    "10": {
      "branch": "16\"",
      "head": "10\" - 12\"",
      "cutter": 14.468,
      "bco": 10
    },
    "12": {
      "branch": "16\"",
      "head": "10\" - 12\"",
      "cutter": 14.468,
      "bco": 12
    },
    "14": {
      "branch": "20\"",
      "head": "14\" - 16\"",
      "cutter": 18.468,
      "bco": 14
    },
    "16": {
      "branch": "20\"",
      "head": "14\" - 16\"",
      "cutter": 18.468,
      "bco": 16
    }
  },
  "plant150": [
    [
      "3\"",
      "3/16\"",
      "5/8\"",
      "4"
    ],
    [
      "4\"",
      "3/16\"",
      "5/8\"",
      "4"
    ],
    [
      "6\"",
      "1/4\"",
      "3/4\"",
      "4"
    ],
    [
      "8\"",
      "5/16\"",
      "7/8\"",
      "4"
    ],
    [
      "10\"",
      "5/16\"",
      "7/8\"",
      "6"
    ],
    [
      "12\"",
      "7/16\"",
      "1 1/16\"",
      "6"
    ],
    [
      "14\"",
      "7/16\"",
      "1 1/4\"",
      "6"
    ],
    [
      "16\"",
      "7/16\"",
      "1 1/4\"",
      "8"
    ],
    [
      "18\"",
      "7/16\"",
      "1 1/4\"",
      "8"
    ],
    [
      "20\"",
      "7/16\"",
      "1 1/4\"",
      "10"
    ],
    [
      "24\"",
      "7/16\"",
      "1 1/4\"",
      "10"
    ],
    [
      "30\"",
      "7/16\"",
      "1 3/8\"",
      "14"
    ],
    [
      "36\"",
      "7/16\"",
      "1 3/8\"",
      "16"
    ]
  ],
  "plant600": [
    [
      "3\"",
      "3/8\"",
      "1 1/16\"",
      "4"
    ],
    [
      "4\"",
      "3/8\"",
      "1 1/4\"",
      "4"
    ],
    [
      "6\"",
      "3/8\"",
      "1 1/4\"",
      "6"
    ],
    [
      "8\"",
      "9/16\"",
      "1 5/8\"",
      "6"
    ],
    [
      "10\"",
      "9/16\"",
      "1 5/8\"",
      "8"
    ],
    [
      "12\"",
      "9/16\"",
      "1 5/8\"",
      "10"
    ],
    [
      "14\"",
      "5/8\"",
      "1 5/8\"",
      "10"
    ],
    [
      "16\"",
      "11/16\"",
      "1 13/16\"",
      "10"
    ],
    [
      "18\"",
      "13/16\"",
      "1 13/16\"",
      "10"
    ],
    [
      "20\"",
      "13/16\"",
      "1 13/16\"",
      "12"
    ],
    [
      "24\"",
      "1\"",
      "2 1/8\"",
      "12"
    ],
    [
      "30\"",
      "1 1/16\"",
      "2 1/4\"",
      "14"
    ],
    [
      "36\"",
      "1 1/16\"",
      "2 1/2\"",
      "14"
    ]
  ],
  "sealtite": [
    [
      "3\"",
      "150#",
      "1.875\"",
      "2.375\"",
      "9",
      "9"
    ],
    [
      "3\"",
      "600#",
      "1.5\"",
      "2.625\"",
      "15",
      "15"
    ],
    [
      "4\"",
      "150#",
      "1.5\"",
      "2.5\"",
      "18",
      "18"
    ],
    [
      "4\"",
      "600#",
      "1.75\"",
      "2.875\"",
      "15",
      "15"
    ],
    [
      "6\"",
      "150#",
      "1.625\"",
      "2\"",
      "6",
      "6"
    ],
    [
      "6\"",
      "600#",
      "1.875\"",
      "3.25\"",
      "17",
      "17"
    ],
    [
      "8\"",
      "150#",
      "1.625\"",
      "2.375\"",
      "9",
      "9"
    ],
    [
      "8\"",
      "600#",
      "1.75\"",
      "3.375\"",
      "17",
      "17"
    ],
    [
      "10\"",
      "150#",
      "1.625\"",
      "2.375\"",
      "9",
      "9"
    ],
    [
      "10\"",
      "600#",
      "2\"",
      "3.5\"",
      "15",
      "15"
    ],
    [
      "12\"",
      "150#",
      "1.5\"",
      "2.438\"",
      "9",
      "9"
    ],
    [
      "12\"",
      "600#",
      "1.875\"",
      "3.563\"",
      "17",
      "17"
    ],
    [
      "14\"",
      "150#",
      "1.938\"",
      "2.75\"",
      "8",
      "8"
    ],
    [
      "14\"",
      "600#",
      "1.813\"",
      "3.813\"",
      "17.5",
      "17.5"
    ],
    [
      "16\"",
      "150#",
      "1.625\"",
      "3\"",
      "14",
      "14"
    ],
    [
      "16\"",
      "600#",
      "2\"",
      "3.625\"",
      "13",
      "13"
    ],
    [
      "18\"",
      "150#",
      "2\"",
      "2.75\"",
      "7.5",
      "7.5"
    ],
    [
      "18\"",
      "600#",
      "2\"",
      "2.75\"",
      "7.5",
      "7.5"
    ],
    [
      "20\"",
      "150#",
      "1.5\"",
      "2.75\"",
      "13",
      "13"
    ],
    [
      "20\"",
      "600#",
      "1.5\"",
      "2.75\"",
      "13",
      "13"
    ],
    [
      "24\"",
      "150#",
      "1.375\"",
      "2.813\"",
      "14",
      "14"
    ],
    [
      "24\"",
      "600#",
      "1.375\"",
      "2.813\"",
      "14",
      "14"
    ],
    [
      "30\"",
      "150#",
      "1.75\"",
      "2.875\"",
      "9",
      "9"
    ],
    [
      "30\"",
      "600#",
      "1.75\"",
      "2.875\"",
      "9",
      "9"
    ],
    [
      "36\"",
      "150#",
      "2\"",
      "3.25\"",
      "11",
      "11"
    ],
    [
      "36\"",
      "600#",
      "2\"",
      "3.25\"",
      "11",
      "11"
    ]
  ],
  "garlock": [
    {
      "size": "1/2",
      "area": "0.94",
      "bolts": "4",
      "boltSize": "0.50",
      "torque60": "60",
      "maxStress": "32118",
      "minTorque": "11",
      "maxRecStress": "20000",
      "preferredTorque": "37"
    },
    {
      "size": "3/4",
      "area": "1.36",
      "bolts": "4",
      "boltSize": "0.63",
      "torque60": "120",
      "maxStress": "35629",
      "minTorque": "20",
      "maxRecStress": "20000",
      "preferredTorque": "67"
    },
    {
      "size": "1",
      "area": "1.79",
      "bolts": "4",
      "boltSize": "0.63",
      "torque60": "120",
      "maxStress": "27027",
      "minTorque": "27",
      "maxRecStress": "20000",
      "preferredTorque": "89"
    },
    {
      "size": "1-1/4",
      "area": "2.74",
      "bolts": "4",
      "boltSize": "0.63",
      "torque60": "120",
      "maxStress": "17664",
      "minTorque": "41",
      "maxRecStress": "17664",
      "preferredTorque": "120"
    },
    {
      "size": "1-1/2",
      "area": "3.65",
      "bolts": "4",
      "boltSize": "0.75",
      "torque60": "200",
      "maxStress": "19862",
      "minTorque": "60",
      "maxRecStress": "19862",
      "preferredTorque": "200"
    },
    {
      "size": "2",
      "area": "5.84",
      "bolts": "8",
      "boltSize": "0.63",
      "torque60": "120",
      "maxStress": "16593",
      "minTorque": "43",
      "maxRecStress": "16593",
      "preferredTorque": "120"
    },
    {
      "size": "2-1/2",
      "area": "6.82",
      "bolts": "8",
      "boltSize": "0.75",
      "torque60": "200",
      "maxStress": "21264",
      "minTorque": "56",
      "maxRecStress": "20000",
      "preferredTorque": "188"
    },
    {
      "size": "3",
      "area": "10.01",
      "bolts": "8",
      "boltSize": "0.75",
      "torque60": "200",
      "maxStress": "14476",
      "minTorque": "83",
      "maxRecStress": "14476",
      "preferredTorque": "200"
    },
    {
      "size": "4",
      "area": "14.19",
      "bolts": "8",
      "boltSize": "0.88",
      "torque60": "320",
      "maxStress": "14174",
      "minTorque": "135",
      "maxRecStress": "14174",
      "preferredTorque": "320"
    },
    {
      "size": "5",
      "area": "17.69",
      "bolts": "8",
      "boltSize": "1.00",
      "torque60": "490",
      "maxStress": "14952",
      "minTorque": "197",
      "maxRecStress": "14952",
      "preferredTorque": "490"
    },
    {
      "size": "6",
      "area": "22.33",
      "bolts": "12",
      "boltSize": "1.00",
      "torque60": "490",
      "maxStress": "17770",
      "minTorque": "165",
      "maxRecStress": "17770",
      "preferredTorque": "490"
    },
    {
      "size": "8",
      "area": "30.22",
      "bolts": "12",
      "boltSize": "1.13",
      "torque60": "710",
      "maxStress": "17344",
      "minTorque": "246",
      "maxRecStress": "17344",
      "preferredTorque": "710"
    },
    {
      "size": "10",
      "area": "36.91",
      "bolts": "16",
      "boltSize": "1.25",
      "torque60": "1000",
      "maxStress": "24160",
      "minTorque": "248",
      "maxRecStress": "20000",
      "preferredTorque": "828"
    },
    {
      "size": "12",
      "area": "49.04",
      "bolts": "20",
      "boltSize": "1.25",
      "torque60": "1000",
      "maxStress": "22733",
      "minTorque": "264",
      "maxRecStress": "20000",
      "preferredTorque": "880"
    },
    {
      "size": "14",
      "area": "53.46",
      "bolts": "20",
      "boltSize": "1.38",
      "torque60": "1360",
      "maxStress": "25928",
      "minTorque": "315",
      "maxRecStress": "20000",
      "preferredTorque": "1049"
    },
    {
      "size": "16",
      "area": "67.74",
      "bolts": "20",
      "boltSize": "1.50",
      "torque60": "1600",
      "maxStress": "24889",
      "minTorque": "386",
      "maxRecStress": "20000",
      "preferredTorque": "1286"
    },
    {
      "size": "18",
      "area": "91.89",
      "bolts": "20",
      "boltSize": "1.63",
      "torque60": "2200",
      "maxStress": "21939",
      "minTorque": "602",
      "maxRecStress": "20000",
      "preferredTorque": "2006"
    },
    {
      "size": "20",
      "area": "101.32",
      "bolts": "24",
      "boltSize": "1.63",
      "torque60": "2200",
      "maxStress": "23878",
      "minTorque": "553",
      "maxRecStress": "20000",
      "preferredTorque": "1843"
    },
    {
      "size": "24",
      "area": "130.82",
      "bolts": "24",
      "boltSize": "1.88",
      "torque60": "4000",
      "maxStress": "25362",
      "minTorque": "946",
      "maxRecStress": "20000",
      "preferredTorque": "3154"
    }
  ],
  "manual": {
    "threadMakeupRows": [
      {
        "size": "1/2\"",
        "makeup": "7/16\""
      },
      {
        "size": "3/4\"",
        "makeup": "7/16\""
      },
      {
        "size": "1\"",
        "makeup": "1/2\""
      },
      {
        "size": "1-1/4\"",
        "makeup": "9/16\""
      },
      {
        "size": "1-1/2\"",
        "makeup": "9/16\""
      },
      {
        "size": "2\"",
        "makeup": "9/16\""
      },
      {
        "size": "2-1/2\"",
        "makeup": "7/8\""
      },
      {
        "size": "3\"",
        "makeup": "15/16\""
      },
      {
        "size": "4\"",
        "makeup": "1-1/16\""
      }
    ],
    "cutterRpmRows": [
      {
        "machine": "T101",
        "cutter": "2\"",
        "rpm": "195"
      },
      {
        "machine": "T101",
        "cutter": "3\"",
        "rpm": "120"
      },
      {
        "machine": "T101",
        "cutter": "4\"",
        "rpm": "100"
      },
      {
        "machine": "C1-25 / C1-36",
        "cutter": "3\"",
        "rpm": "50-60"
      },
      {
        "machine": "C1-25 / C1-36",
        "cutter": "4\"",
        "rpm": "50-60"
      },
      {
        "machine": "C1-25 / C1-36",
        "cutter": "6\"",
        "rpm": "50-60"
      },
      {
        "machine": "C1-25 / C1-36",
        "cutter": "8\"",
        "rpm": "50-60"
      },
      {
        "machine": "C1-25 / C1-36",
        "cutter": "10\"",
        "rpm": "50-60"
      },
      {
        "machine": "C1-25 / C1-36",
        "cutter": "12\"",
        "rpm": "50-60"
      },
      {
        "machine": "360",
        "cutter": "2\"",
        "rpm": "35-45"
      },
      {
        "machine": "360",
        "cutter": "3\"",
        "rpm": "35-45"
      },
      {
        "machine": "360",
        "cutter": "4\"",
        "rpm": "35-45"
      },
      {
        "machine": "360",
        "cutter": "6\"",
        "rpm": "35"
      },
      {
        "machine": "660 / 760",
        "cutter": "3\"",
        "rpm": "37"
      },
      {
        "machine": "660 / 760",
        "cutter": "4\"",
        "rpm": "37"
      },
      {
        "machine": "660 / 760",
        "cutter": "6\"",
        "rpm": "37"
      },
      {
        "machine": "660 / 760",
        "cutter": "8\"",
        "rpm": "37"
      },
      {
        "machine": "660 / 760",
        "cutter": "10\"",
        "rpm": "37"
      },
      {
        "machine": "660 / 760",
        "cutter": "12\"",
        "rpm": "33"
      },
      {
        "machine": "660 / 760",
        "cutter": "14\"",
        "rpm": "30"
      },
      {
        "machine": "1200",
        "cutter": "12\"",
        "rpm": "25"
      },
      {
        "machine": "1200",
        "cutter": "14\"",
        "rpm": "23"
      },
      {
        "machine": "1200",
        "cutter": "16\"",
        "rpm": "21"
      },
      {
        "machine": "1200",
        "cutter": "18\"",
        "rpm": "19"
      },
      {
        "machine": "1200",
        "cutter": "20\"",
        "rpm": "17"
      },
      {
        "machine": "1200",
        "cutter": "22\"",
        "rpm": "16"
      },
      {
        "machine": "1200",
        "cutter": "24\"",
        "rpm": "14"
      },
      {
        "machine": "1200",
        "cutter": "26\"",
        "rpm": "12"
      },
      {
        "machine": "1200",
        "cutter": "28\"",
        "rpm": "12"
      },
      {
        "machine": "1200",
        "cutter": "30\"",
        "rpm": "12"
      },
      {
        "machine": "1200",
        "cutter": "34\"",
        "rpm": "12"
      },
      {
        "machine": "1200",
        "cutter": "36\"",
        "rpm": "12"
      },
      {
        "machine": "1200",
        "cutter": "38\"",
        "rpm": "12"
      },
      {
        "machine": "1200",
        "cutter": "40\"",
        "rpm": "12"
      }
    ],
    "hiStopAdapterRows": [
      {
        "size": "2\"",
        "bore": "3.130\""
      },
      {
        "size": "3\"",
        "bore": "4.130\""
      },
      {
        "size": "4\"",
        "bore": "6.130\""
      },
      {
        "size": "6\"",
        "bore": "8.130\""
      },
      {
        "size": "8\"",
        "bore": "10.130\""
      },
      {
        "size": "10\"",
        "bore": "12.130\""
      },
      {
        "size": "12\"",
        "bore": "13.250\""
      },
      {
        "size": "14\"",
        "bore": "15.250\""
      },
      {
        "size": "16\"",
        "bore": "17.250\""
      }
    ],
    "hiStopBoltCircleRows": [
      {
        "size": "2\"",
        "circle": "6.625\""
      },
      {
        "size": "3\"",
        "circle": "8.500\""
      },
      {
        "size": "4\"",
        "circle": "11.500\""
      },
      {
        "size": "6\"",
        "circle": "13.750\""
      },
      {
        "size": "8\"",
        "circle": "17.000\""
      },
      {
        "size": "10\"",
        "circle": "19.250\""
      },
      {
        "size": "12\"",
        "circle": "20.750\""
      },
      {
        "size": "14\"",
        "circle": "23.750\""
      },
      {
        "size": "16\"",
        "circle": "25.750\""
      }
    ],
    "hiStopTorqueRows": [
      {
        "flange": "2\" 600# (360TM)",
        "pattern": "1-5-3-7-2-6-4-8",
        "passes": "1st 63 ft/lbs, 2nd 74 ft/lbs, 3rd 84 ft/lbs, final 84 ft/lbs"
      },
      {
        "flange": "4\" 600# (660TM)",
        "pattern": "1-5-3-7-2-6-4-8",
        "passes": "1st 180 ft/lbs, 2nd 210 ft/lbs, 3rd 240 ft/lbs, final 240 ft/lbs"
      },
      {
        "flange": "6\" 600# (1200TM)",
        "pattern": "1-5-9-3-7-11-2-6-10-4-8-12",
        "passes": "1st 270 ft/lbs, 2nd 315 ft/lbs, 3rd 360 ft/lbs, final 360 ft/lbs"
      }
    ],
    "hiStopPressureRows": [
      {
        "machine": "T-101 style machines",
        "cold": "1480 psi @ 100 F",
        "hot": "700 psi @ 700 F"
      },
      {
        "machine": "360 style machines",
        "cold": "1480 psi @ 100 F",
        "hot": "700 psi @ 700 F"
      },
      {
        "machine": "660 / 760 style machines",
        "cold": "1480 psi @ 100 F",
        "hot": "700 psi @ 700 F"
      },
      {
        "machine": "1200 style machines",
        "cold": "1480 psi @ 100 F",
        "hot": "700 psi @ 700 F"
      },
      {
        "machine": "CH-24",
        "cold": "1480 psi @ 100 F",
        "hot": "700 psi @ 500 F"
      },
      {
        "machine": "936 and subsea machines",
        "cold": "1480 psi @ 100 F",
        "hot": "Max temp 180 F"
      }
    ],
    "flangePressureRows": [
      {
        "flange": "150# flange",
        "cold": "285 psi @ -20 F to 100 F",
        "hot": "110 psi @ 700 F"
      },
      {
        "flange": "300# flange",
        "cold": "740 psi @ -20 F to 100 F",
        "hot": "535 psi @ 700 F"
      },
      {
        "flange": "600# flange",
        "cold": "1480 psi @ -20 F to 100 F",
        "hot": "700 psi @ 700 F"
      },
      {
        "flange": "900# flange",
        "cold": "2220 psi @ -20 F to 100 F",
        "hot": "1600 psi @ 700 F"
      },
      {
        "flange": "1500# flange",
        "cold": "3705 psi @ -20 F to 100 F",
        "hot": "2665 psi @ 700 F"
      },
      {
        "flange": "2500# flange",
        "cold": "6170 psi @ -20 F to 100 F",
        "hot": "4440 psi @ 700 F"
      }
    ],
    "machineSpecRows": [
      {
        "name": "I-914",
        "pressure": "1440 psi @ 100 F",
        "temperature": "-20 F to 700 F @ 700 psi",
        "travel": "109\"",
        "feed": "0.004 in/rev auto; approx. 12 turns/in hand crank",
        "range": "12\" through 42\"",
        "flange": "6\" 600# RTJ, R45 ring",
        "bolts": "1\" bolt, 1-5/8\" wrench",
        "weight": "3000 lbs",
        "drive": "1\" square socket",
        "bar": "4\" OD boring bar"
      },
      {
        "name": "C1-25 / C1-36",
        "pressure": "500 psi @ 100 F",
        "temperature": "-20 F to 500 F @ 250 psi",
        "travel": "25\" / 36\"",
        "feed": "Approx. 6 turns/in hand crank",
        "range": "C1-25: 4\" through 10\"; C1-36: 4\" through 12\"",
        "flange": "4\" 150# flange",
        "bolts": "5/8\" bolts, 1-1/16\" wrench",
        "weight": "175 lbs / 270 lbs",
        "drive": "Manual",
        "bar": "2.5\" OD boring bar"
      },
      {
        "name": "660 / 760 TM",
        "pressure": "1440 psi @ 100 F",
        "temperature": "-20 F to 700 F @ 700 psi",
        "travel": "660TM: 42\"; 760TM: 66\"",
        "feed": "0.003 in/rev auto; approx. 4.5 turns/in hand crank",
        "range": "660TM: 4\" through 12\"; 760TM: 4\" through 14\"",
        "flange": "4\" 600# RTJ, R37 ring",
        "bolts": "7/8\" bolt, 1-7/16\" wrench",
        "weight": "460 lbs / 540 lbs",
        "drive": "1/2\" square socket",
        "bar": "2.5\" OD boring bar"
      }
    ],
    "toleranceRows": [
      {
        "od": "1.688\"",
        "length": "24\", 30\"",
        "runout": ".045\"",
        "lash": ".025\"",
        "travel": ".005\" - .020\""
      },
      {
        "od": "2.5\"",
        "length": "42\"",
        "runout": ".062\"",
        "lash": ".030\"",
        "travel": ".005\" - .020\""
      },
      {
        "od": "2.5\"",
        "length": "66\"",
        "runout": ".094\"",
        "lash": ".030\"",
        "travel": ".005\" - .020\""
      },
      {
        "od": "4\"",
        "length": "72\", 80\"",
        "runout": ".094\"",
        "lash": ".040\"",
        "travel": ".005\" - .020\""
      },
      {
        "od": "4\"",
        "length": "102\", 108\", 110\"",
        "runout": ".102\"",
        "lash": ".040\"",
        "travel": ".005\" - .020\""
      },
      {
        "od": "4\"",
        "length": "120\", 130\"",
        "runout": ".110\"",
        "lash": ".040\"",
        "travel": ".005\" - .020\""
      },
      {
        "od": "4.5\"",
        "length": "72\"",
        "runout": ".094\"",
        "lash": ".040\"",
        "travel": ".005\" - .020\""
      },
      {
        "od": "4.5\"",
        "length": "120\"",
        "runout": ".110\"",
        "lash": ".040\"",
        "travel": ".005\" - .020\""
      }
    ],
    "checklistGroups": [
      {
        "title": "Post-job drive ring",
        "items": [
          "Inspect drive ring for cracks or damage.",
          "Check for broken screws or stripped threads."
        ]
      },
      {
        "title": "Inner bar / retainer rod",
        "items": [
          "Measure feed screw to inner bar with tape measure.",
          "Measure feed screw to inner bar with measuring rod."
        ]
      },
      {
        "title": "Packing service note",
        "items": [
          "Change inner and outer packing after 350 F or greater service.",
          "Change packing after corrosive service.",
          "Record packing material: N/A, Aflas, or Buna."
        ]
      },
      {
        "title": "Packing nuts and pressure test",
        "items": [
          "Remove, clean, and inspect outer bar packing nut threads and wiper seal.",
          "Lubricate and reinstall packing nuts; tighten then back off 1/4 turn.",
          "Record pressure-test date, duration, pressure, temperature, medium, pass/fail, and observer."
        ]
      }
    ]
  },
  "smartstop": {
    "suffixCharts": [
      {
        "size": "4",
        "label": "4\" SmartStop",
        "pdfPage": 96,
        "printedPage": 29,
        "note": "Source has separate primary and secondary nose pad columns. Row -07 is printed after -06 but covers the thinnest wall range.",
        "rows": [
          {
            "suffix": "-01",
            "sourceLabel": "-01",
            "pressure": "Standard",
            "wallMin": 0.204,
            "wallMax": 0.218,
            "wallLabel": ".204 - .218",
            "pipeIdMin": 4.064,
            "pipeIdMax": 4.093,
            "pipeIdLabel": "4.064 - 4.093",
            "footPadShims": 3,
            "nosePadShims": 1,
            "noseRing": "-01",
            "seal": "-X1",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "",
            "primaryNosePad": "-01",
            "secondaryNosePad": "-01",
            "sourceNote": ""
          },
          {
            "suffix": "-02",
            "sourceLabel": "-02",
            "pressure": "Standard",
            "wallMin": 0.219,
            "wallMax": 0.248,
            "wallLabel": ".219 - .248",
            "pipeIdMin": 4.004,
            "pipeIdMax": 4.063,
            "pipeIdLabel": "4.004 - 4.063",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-01",
            "seal": "-X2",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "",
            "primaryNosePad": "-01",
            "secondaryNosePad": "-02",
            "sourceNote": ""
          },
          {
            "suffix": "-03",
            "sourceLabel": "-03",
            "pressure": "Standard",
            "wallMin": 0.249,
            "wallMax": 0.279,
            "wallLabel": ".249 - .279",
            "pipeIdMin": 3.942,
            "pipeIdMax": 4.003,
            "pipeIdLabel": "3.942 - 4.003",
            "footPadShims": 3,
            "nosePadShims": 1,
            "noseRing": "-02",
            "seal": "-X3",
            "retainingRing": "-02",
            "footPad": "-02",
            "nosePad": "",
            "primaryNosePad": "-02",
            "secondaryNosePad": "-03",
            "sourceNote": ""
          },
          {
            "suffix": "-04",
            "sourceLabel": "-04",
            "pressure": "Standard",
            "wallMin": 0.28,
            "wallMax": 0.309,
            "wallLabel": ".280 - .309",
            "pipeIdMin": 3.882,
            "pipeIdMax": 3.941,
            "pipeIdLabel": "3.882 - 3.941",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-02",
            "seal": "-X4",
            "retainingRing": "-02",
            "footPad": "-02",
            "nosePad": "",
            "primaryNosePad": "-02",
            "secondaryNosePad": "-04",
            "sourceNote": ""
          },
          {
            "suffix": "-05",
            "sourceLabel": "-05",
            "pressure": "Standard",
            "wallMin": 0.31,
            "wallMax": 0.34,
            "wallLabel": ".310 - .340",
            "pipeIdMin": 3.82,
            "pipeIdMax": 3.881,
            "pipeIdLabel": "3.820 - 3.881",
            "footPadShims": 3,
            "nosePadShims": 1,
            "noseRing": "-03",
            "seal": "-X5",
            "retainingRing": "-03",
            "footPad": "-03",
            "nosePad": "",
            "primaryNosePad": "-03",
            "secondaryNosePad": "-05",
            "sourceNote": ""
          },
          {
            "suffix": "-06",
            "sourceLabel": "-06",
            "pressure": "Standard",
            "wallMin": 0.341,
            "wallMax": 0.37,
            "wallLabel": ".341 - .370",
            "pipeIdMin": 3.76,
            "pipeIdMax": 3.819,
            "pipeIdLabel": "3.760 - 3.819",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-03",
            "seal": "-X6",
            "retainingRing": "-03",
            "footPad": "-03",
            "nosePad": "",
            "primaryNosePad": "-03",
            "secondaryNosePad": "-06",
            "sourceNote": ""
          },
          {
            "suffix": "-07",
            "sourceLabel": "-07",
            "pressure": "Standard",
            "wallMin": 0.188,
            "wallMax": 0.203,
            "wallLabel": ".188 - .203",
            "pipeIdMin": 4.094,
            "pipeIdMax": 4.124,
            "pipeIdLabel": "4.094 - 4.124",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-01",
            "seal": "-X1",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "",
            "primaryNosePad": "-01",
            "secondaryNosePad": "-07",
            "sourceNote": "Printed out of wall-thickness order on the source chart."
          }
        ]
      },
      {
        "size": "6",
        "label": "6\" SmartStop",
        "pdfPage": 97,
        "printedPage": 30,
        "note": "Source row -03 wall range reads .230 - .266 and overlaps row -02. Preserved exactly as shown.",
        "rows": [
          {
            "suffix": "-01",
            "sourceLabel": "-01",
            "pressure": "Standard",
            "wallMin": 0.166,
            "wallMax": 0.202,
            "wallLabel": ".166 - .202",
            "pipeIdMin": 6.221,
            "pipeIdMax": 6.293,
            "pipeIdLabel": "6.221 - 6.293",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-01",
            "seal": "-X1",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "-01",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-02",
            "sourceLabel": "-02",
            "pressure": "Standard",
            "wallMin": 0.202,
            "wallMax": 0.238,
            "wallLabel": ".202 - .238",
            "pipeIdMin": 6.149,
            "pipeIdMax": 6.221,
            "pipeIdLabel": "6.149 - 6.221",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-01",
            "seal": "-X2",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "-01",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-03",
            "sourceLabel": "-03",
            "pressure": "Standard",
            "wallMin": 0.23,
            "wallMax": 0.266,
            "wallLabel": ".230 - .266",
            "pipeIdMin": 6.093,
            "pipeIdMax": 6.166,
            "pipeIdLabel": "6.093 - 6.166",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-02",
            "seal": "-X3",
            "retainingRing": "-02",
            "footPad": "-02",
            "nosePad": "-02",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": "Wall range overlaps row -02 in the source scan."
          },
          {
            "suffix": "-04",
            "sourceLabel": "-04",
            "pressure": "Standard",
            "wallMin": 0.266,
            "wallMax": 0.302,
            "wallLabel": ".266 - .302",
            "pipeIdMin": 6.021,
            "pipeIdMax": 6.093,
            "pipeIdLabel": "6.021 - 6.093",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-02",
            "seal": "-X4",
            "retainingRing": "-02",
            "footPad": "-02",
            "nosePad": "-02",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-05",
            "sourceLabel": "-05",
            "pressure": "Standard",
            "wallMin": 0.303,
            "wallMax": 0.339,
            "wallLabel": ".303 - .339",
            "pipeIdMin": 5.947,
            "pipeIdMax": 6.02,
            "pipeIdLabel": "5.947 - 6.020",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-03",
            "seal": "-X5",
            "retainingRing": "-03",
            "footPad": "-03",
            "nosePad": "-03",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-06",
            "sourceLabel": "-06",
            "pressure": "Standard",
            "wallMin": 0.339,
            "wallMax": 0.375,
            "wallLabel": ".339 - .375",
            "pipeIdMin": 5.875,
            "pipeIdMax": 5.947,
            "pipeIdLabel": "5.875 - 5.947",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-03",
            "seal": "-X6",
            "retainingRing": "-03",
            "footPad": "-03",
            "nosePad": "-03",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-07",
            "sourceLabel": "-07",
            "pressure": "Standard",
            "wallMin": 0.376,
            "wallMax": 0.412,
            "wallLabel": ".376 - .412",
            "pipeIdMin": 5.801,
            "pipeIdMax": 5.874,
            "pipeIdLabel": "5.801 - 5.874",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-04",
            "seal": "-X7",
            "retainingRing": "-04",
            "footPad": "-04",
            "nosePad": "-04",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-08",
            "sourceLabel": "-08",
            "pressure": "Standard",
            "wallMin": 0.412,
            "wallMax": 0.448,
            "wallLabel": ".412 - .448",
            "pipeIdMin": 5.729,
            "pipeIdMax": 5.801,
            "pipeIdLabel": "5.729 - 5.801",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-04",
            "seal": "-X8",
            "retainingRing": "-04",
            "footPad": "-04",
            "nosePad": "-04",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          }
        ]
      },
      {
        "size": "8",
        "label": "8\" SmartStop",
        "pdfPage": 98,
        "printedPage": 31,
        "note": "Rows -09 and -10 are marked 1480 psi on the source chart.",
        "rows": [
          {
            "suffix": "-01",
            "sourceLabel": "-01",
            "pressure": "Standard",
            "wallMin": 0.25,
            "wallMax": 0.298,
            "wallLabel": ".250 - .298",
            "pipeIdMin": 8.029,
            "pipeIdMax": 8.125,
            "pipeIdLabel": "8.029 - 8.125",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-01",
            "seal": "-X1",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "-01",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-02",
            "sourceLabel": "-02",
            "pressure": "Standard",
            "wallMin": 0.299,
            "wallMax": 0.346,
            "wallLabel": ".299 - .346",
            "pipeIdMin": 7.933,
            "pipeIdMax": 8.028,
            "pipeIdLabel": "7.933 - 8.028",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-01",
            "seal": "-X2",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "-01",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-03",
            "sourceLabel": "-03",
            "pressure": "Standard",
            "wallMin": 0.347,
            "wallMax": 0.395,
            "wallLabel": ".347 - .395",
            "pipeIdMin": 7.835,
            "pipeIdMax": 7.932,
            "pipeIdLabel": "7.835 - 7.932",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-02",
            "seal": "-X3",
            "retainingRing": "-02",
            "footPad": "-02",
            "nosePad": "-02",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-04",
            "sourceLabel": "-04",
            "pressure": "Standard",
            "wallMin": 0.396,
            "wallMax": 0.443,
            "wallLabel": ".396 - .443",
            "pipeIdMin": 7.739,
            "pipeIdMax": 7.834,
            "pipeIdLabel": "7.739 - 7.834",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-02",
            "seal": "-X4",
            "retainingRing": "-02",
            "footPad": "-02",
            "nosePad": "-02",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-05",
            "sourceLabel": "-05",
            "pressure": "Standard",
            "wallMin": 0.444,
            "wallMax": 0.492,
            "wallLabel": ".444 - .492",
            "pipeIdMin": 7.641,
            "pipeIdMax": 7.738,
            "pipeIdLabel": "7.641 - 7.738",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-03",
            "seal": "-X5",
            "retainingRing": "-03",
            "footPad": "-03",
            "nosePad": "-03",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-06",
            "sourceLabel": "-06",
            "pressure": "Standard",
            "wallMin": 0.493,
            "wallMax": 0.54,
            "wallLabel": ".493 - .540",
            "pipeIdMin": 7.545,
            "pipeIdMax": 7.64,
            "pipeIdLabel": "7.545 - 7.640",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-03",
            "seal": "-X6",
            "retainingRing": "-03",
            "footPad": "-03",
            "nosePad": "-03",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-07",
            "sourceLabel": "-07",
            "pressure": "Standard",
            "wallMin": 0.541,
            "wallMax": 0.589,
            "wallLabel": ".541 - .589",
            "pipeIdMin": 7.447,
            "pipeIdMax": 7.544,
            "pipeIdLabel": "7.447 - 7.544",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-04",
            "seal": "-X7",
            "retainingRing": "-04",
            "footPad": "-04",
            "nosePad": "-04",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-08",
            "sourceLabel": "-08",
            "pressure": "Standard",
            "wallMin": 0.59,
            "wallMax": 0.637,
            "wallLabel": ".590 - .637",
            "pipeIdMin": 7.351,
            "pipeIdMax": 7.446,
            "pipeIdLabel": "7.351 - 7.446",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-04",
            "seal": "-X8",
            "retainingRing": "-04",
            "footPad": "-04",
            "nosePad": "-04",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-09",
            "sourceLabel": "-09 (1480 psi)",
            "pressure": "1480 psi",
            "wallMin": 0.225,
            "wallMax": 0.25,
            "wallLabel": ".225 - .250",
            "pipeIdMin": 8.125,
            "pipeIdMax": 8.175,
            "pipeIdLabel": "8.125 - 8.175",
            "footPadShims": 6,
            "nosePadShims": 4,
            "noseRing": "-01",
            "seal": "-X1",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "-01",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-10",
            "sourceLabel": "-10 (1480 psi)",
            "pressure": "1480 psi",
            "wallMin": 0.219,
            "wallMax": 0.225,
            "wallLabel": ".219 - .225",
            "pipeIdMin": 8.175,
            "pipeIdMax": 8.187,
            "pipeIdLabel": "8.175 - 8.187",
            "footPadShims": 6,
            "nosePadShims": 6,
            "noseRing": "-01",
            "seal": "-X1",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "-01",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          }
        ]
      },
      {
        "size": "10",
        "label": "10\" SmartStop",
        "pdfPage": 99,
        "printedPage": 32,
        "note": "Rows -10 and -11 are marked 1480 psi on the source chart.",
        "rows": [
          {
            "suffix": "-01",
            "sourceLabel": "-01",
            "pressure": "Standard",
            "wallMin": 0.237,
            "wallMax": 0.287,
            "wallLabel": ".237 - .287",
            "pipeIdMin": 10.176,
            "pipeIdMax": 10.276,
            "pipeIdLabel": "10.176 - 10.276",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-01",
            "seal": "-X1",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "-01",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-02",
            "sourceLabel": "-02",
            "pressure": "Standard",
            "wallMin": 0.288,
            "wallMax": 0.337,
            "wallLabel": ".288 - .337",
            "pipeIdMin": 10.076,
            "pipeIdMax": 10.175,
            "pipeIdLabel": "10.076 - 10.175",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-01",
            "seal": "-X2",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "-01",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-03",
            "sourceLabel": "-03",
            "pressure": "Standard",
            "wallMin": 0.338,
            "wallMax": 0.388,
            "wallLabel": ".338 - .388",
            "pipeIdMin": 9.974,
            "pipeIdMax": 10.075,
            "pipeIdLabel": "9.974 - 10.075",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-02",
            "seal": "-X3",
            "retainingRing": "-02",
            "footPad": "-02",
            "nosePad": "-02",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-04",
            "sourceLabel": "-04",
            "pressure": "Standard",
            "wallMin": 0.389,
            "wallMax": 0.438,
            "wallLabel": ".389 - .438",
            "pipeIdMin": 9.874,
            "pipeIdMax": 9.973,
            "pipeIdLabel": "9.874 - 9.973",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-02",
            "seal": "-X4",
            "retainingRing": "-02",
            "footPad": "-02",
            "nosePad": "-02",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-05",
            "sourceLabel": "-05",
            "pressure": "Standard",
            "wallMin": 0.439,
            "wallMax": 0.489,
            "wallLabel": ".439 - .489",
            "pipeIdMin": 9.772,
            "pipeIdMax": 9.873,
            "pipeIdLabel": "9.772 - 9.873",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-03",
            "seal": "-X5",
            "retainingRing": "-03",
            "footPad": "-03",
            "nosePad": "-03",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-06",
            "sourceLabel": "-06",
            "pressure": "Standard",
            "wallMin": 0.49,
            "wallMax": 0.539,
            "wallLabel": ".490 - .539",
            "pipeIdMin": 9.672,
            "pipeIdMax": 9.771,
            "pipeIdLabel": "9.672 - 9.771",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-03",
            "seal": "-X6",
            "retainingRing": "-03",
            "footPad": "-03",
            "nosePad": "-03",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-07",
            "sourceLabel": "-07",
            "pressure": "Standard",
            "wallMin": 0.54,
            "wallMax": 0.59,
            "wallLabel": ".540 - .590",
            "pipeIdMin": 9.57,
            "pipeIdMax": 9.671,
            "pipeIdLabel": "9.570 - 9.671",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-04",
            "seal": "-X7",
            "retainingRing": "-04",
            "footPad": "-04",
            "nosePad": "-04",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-08",
            "sourceLabel": "-08",
            "pressure": "Standard",
            "wallMin": 0.591,
            "wallMax": 0.64,
            "wallLabel": ".591 - .640",
            "pipeIdMin": 9.47,
            "pipeIdMax": 9.569,
            "pipeIdLabel": "9.470 - 9.569",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-04",
            "seal": "-X8",
            "retainingRing": "-04",
            "footPad": "-04",
            "nosePad": "-04",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-09",
            "sourceLabel": "-09",
            "pressure": "Standard",
            "wallMin": 0.641,
            "wallMax": 0.691,
            "wallLabel": ".641 - .691",
            "pipeIdMin": 9.368,
            "pipeIdMax": 9.469,
            "pipeIdLabel": "9.368 - 9.469",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-05",
            "seal": "-X9",
            "retainingRing": "-05",
            "footPad": "-05",
            "nosePad": "-05",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-10",
            "sourceLabel": "-10 (1480 psi)",
            "pressure": "1480 psi",
            "wallMin": 0.212,
            "wallMax": 0.236,
            "wallLabel": ".212 - .236",
            "pipeIdMin": 10.277,
            "pipeIdMax": 10.326,
            "pipeIdLabel": "10.277 - 10.326",
            "footPadShims": 6,
            "nosePadShims": 4,
            "noseRing": "-01",
            "seal": "-X1",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "-01",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-11",
            "sourceLabel": "-11 (1480 psi)",
            "pressure": "1480 psi",
            "wallMin": 0.187,
            "wallMax": 0.211,
            "wallLabel": ".187 - .211",
            "pipeIdMin": 10.327,
            "pipeIdMax": 10.376,
            "pipeIdLabel": "10.327 - 10.376",
            "footPadShims": 9,
            "nosePadShims": 6,
            "noseRing": "-01",
            "seal": "-X1",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "-01",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          }
        ]
      },
      {
        "size": "12",
        "label": "12\" SmartStop",
        "pdfPage": 100,
        "printedPage": 33,
        "note": "Source row -03 wall range reads .343 - .406 and overlaps row -02. Preserved exactly as shown.",
        "rows": [
          {
            "suffix": "-01",
            "sourceLabel": "-01",
            "pressure": "Standard",
            "wallMin": 0.25,
            "wallMax": 0.313,
            "wallLabel": ".250 - .313",
            "pipeIdMin": 12.125,
            "pipeIdMax": 12.25,
            "pipeIdLabel": "12.125 - 12.250",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-01",
            "seal": "-X1",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "-01",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-02",
            "sourceLabel": "-02",
            "pressure": "Standard",
            "wallMin": 0.313,
            "wallMax": 0.376,
            "wallLabel": ".313 - .376",
            "pipeIdMin": 11.999,
            "pipeIdMax": 12.125,
            "pipeIdLabel": "11.999 - 12.125",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-01",
            "seal": "-X2",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "-01",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-03",
            "sourceLabel": "-03",
            "pressure": "Standard",
            "wallMin": 0.343,
            "wallMax": 0.406,
            "wallLabel": ".343 - .406",
            "pipeIdMin": 11.938,
            "pipeIdMax": 12.064,
            "pipeIdLabel": "11.938 - 12.064",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-02",
            "seal": "-X3",
            "retainingRing": "-02",
            "footPad": "-02",
            "nosePad": "-02",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": "Wall range overlaps row -02 in the source scan."
          },
          {
            "suffix": "-04",
            "sourceLabel": "-04",
            "pressure": "Standard",
            "wallMin": 0.406,
            "wallMax": 0.469,
            "wallLabel": ".406 - .469",
            "pipeIdMin": 11.812,
            "pipeIdMax": 11.938,
            "pipeIdLabel": "11.812 - 11.938",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-02",
            "seal": "-X4",
            "retainingRing": "-02",
            "footPad": "-02",
            "nosePad": "-02",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-05",
            "sourceLabel": "-05",
            "pressure": "Standard",
            "wallMin": 0.468,
            "wallMax": 0.531,
            "wallLabel": ".468 - .531",
            "pipeIdMin": 11.688,
            "pipeIdMax": 11.814,
            "pipeIdLabel": "11.688 - 11.814",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-03",
            "seal": "-X5",
            "retainingRing": "-03",
            "footPad": "-03",
            "nosePad": "-03",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-06",
            "sourceLabel": "-06",
            "pressure": "Standard",
            "wallMin": 0.531,
            "wallMax": 0.594,
            "wallLabel": ".531 - .594",
            "pipeIdMin": 11.562,
            "pipeIdMax": 11.688,
            "pipeIdLabel": "11.562 - 11.688",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-03",
            "seal": "-X6",
            "retainingRing": "-03",
            "footPad": "-03",
            "nosePad": "-03",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-07",
            "sourceLabel": "-07",
            "pressure": "Standard",
            "wallMin": 0.593,
            "wallMax": 0.656,
            "wallLabel": ".593 - .656",
            "pipeIdMin": 11.438,
            "pipeIdMax": 11.564,
            "pipeIdLabel": "11.438 - 11.564",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-04",
            "seal": "-X7",
            "retainingRing": "-04",
            "footPad": "-04",
            "nosePad": "-04",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-08",
            "sourceLabel": "-08",
            "pressure": "Standard",
            "wallMin": 0.656,
            "wallMax": 0.719,
            "wallLabel": ".656 - .719",
            "pipeIdMin": 11.312,
            "pipeIdMax": 11.438,
            "pipeIdLabel": "11.312 - 11.438",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-04",
            "seal": "-X8",
            "retainingRing": "-04",
            "footPad": "-04",
            "nosePad": "-04",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-09",
            "sourceLabel": "-09",
            "pressure": "Standard",
            "wallMin": 0.719,
            "wallMax": 0.782,
            "wallLabel": ".719 - .782",
            "pipeIdMin": 11.187,
            "pipeIdMax": 11.313,
            "pipeIdLabel": "11.187 - 11.313",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-05",
            "seal": "-X9",
            "retainingRing": "-05",
            "footPad": "-05",
            "nosePad": "-05",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-10",
            "sourceLabel": "-10 (1480 psi)",
            "pressure": "1480 psi",
            "wallMin": 0.219,
            "wallMax": 0.25,
            "wallLabel": ".219 - .250",
            "pipeIdMin": 12.25,
            "pipeIdMax": 12.312,
            "pipeIdLabel": "12.250 - 12.312",
            "footPadShims": 6,
            "nosePadShims": 4,
            "noseRing": "-01",
            "seal": "-X1",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "-01",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          }
        ]
      },
      {
        "size": "16",
        "label": "16\" SmartStop",
        "pdfPage": 101,
        "printedPage": 34,
        "note": "Row -09 is marked 1480 psi on the source chart.",
        "rows": [
          {
            "suffix": "-01",
            "sourceLabel": "-01",
            "pressure": "Standard",
            "wallMin": 0.25,
            "wallMax": 0.324,
            "wallLabel": ".250 - .324",
            "pipeIdMin": 15.351,
            "pipeIdMax": 15.5,
            "pipeIdLabel": "15.351 - 15.500",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-01",
            "seal": "-X1",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "-01",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-02",
            "sourceLabel": "-02",
            "pressure": "Standard",
            "wallMin": 0.325,
            "wallMax": 0.4,
            "wallLabel": ".325 - .400",
            "pipeIdMin": 15.2,
            "pipeIdMax": 15.35,
            "pipeIdLabel": "15.200 - 15.350",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-01",
            "seal": "-X2",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "-01",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-03",
            "sourceLabel": "-03",
            "pressure": "Standard",
            "wallMin": 0.401,
            "wallMax": 0.476,
            "wallLabel": ".401 - .476",
            "pipeIdMin": 15.048,
            "pipeIdMax": 15.199,
            "pipeIdLabel": "15.048 - 15.199",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-02",
            "seal": "-X3",
            "retainingRing": "-02",
            "footPad": "-02",
            "nosePad": "-02",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-04",
            "sourceLabel": "-04",
            "pressure": "Standard",
            "wallMin": 0.477,
            "wallMax": 0.551,
            "wallLabel": ".477 - .551",
            "pipeIdMin": 14.898,
            "pipeIdMax": 15.047,
            "pipeIdLabel": "14.898 - 15.047",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-02",
            "seal": "-X4",
            "retainingRing": "-02",
            "footPad": "-02",
            "nosePad": "-02",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-05",
            "sourceLabel": "-05",
            "pressure": "Standard",
            "wallMin": 0.552,
            "wallMax": 0.627,
            "wallLabel": ".552 - .627",
            "pipeIdMin": 14.746,
            "pipeIdMax": 14.897,
            "pipeIdLabel": "14.746 - 14.897",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-03",
            "seal": "-X5",
            "retainingRing": "-03",
            "footPad": "-03",
            "nosePad": "-03",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-06",
            "sourceLabel": "-06",
            "pressure": "Standard",
            "wallMin": 0.628,
            "wallMax": 0.702,
            "wallLabel": ".628 - .702",
            "pipeIdMin": 14.596,
            "pipeIdMax": 14.745,
            "pipeIdLabel": "14.596 - 14.745",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-03",
            "seal": "-X6",
            "retainingRing": "-03",
            "footPad": "-03",
            "nosePad": "-03",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-07",
            "sourceLabel": "-07",
            "pressure": "Standard",
            "wallMin": 0.703,
            "wallMax": 0.778,
            "wallLabel": ".703 - .778",
            "pipeIdMin": 14.444,
            "pipeIdMax": 14.595,
            "pipeIdLabel": "14.444 - 14.595",
            "footPadShims": 3,
            "nosePadShims": 2,
            "noseRing": "-04",
            "seal": "-X7",
            "retainingRing": "-04",
            "footPad": "-04",
            "nosePad": "-04",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-08",
            "sourceLabel": "-08",
            "pressure": "Standard",
            "wallMin": 0.779,
            "wallMax": 0.853,
            "wallLabel": ".779 - .853",
            "pipeIdMin": 14.294,
            "pipeIdMax": 14.443,
            "pipeIdLabel": "14.294 - 14.443",
            "footPadShims": 0,
            "nosePadShims": 0,
            "noseRing": "-04",
            "seal": "-X8",
            "retainingRing": "-04",
            "footPad": "-04",
            "nosePad": "-04",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          },
          {
            "suffix": "-09",
            "sourceLabel": "-09 (1480 psi)",
            "pressure": "1480 psi",
            "wallMin": 0.2,
            "wallMax": 0.249,
            "wallLabel": ".200 - .249",
            "pipeIdMin": 15.501,
            "pipeIdMax": 15.6,
            "pipeIdLabel": "15.501 - 15.600",
            "footPadShims": 6,
            "nosePadShims": 4,
            "noseRing": "-01",
            "seal": "-X1",
            "retainingRing": "-01",
            "footPad": "-01",
            "nosePad": "-01",
            "primaryNosePad": "",
            "secondaryNosePad": "",
            "sourceNote": ""
          }
        ]
      }
    ],
    "torqueRows": [
      {
        "screwSize": "#8",
        "ftLb": "2.5",
        "inLb": "30"
      },
      {
        "screwSize": "#10",
        "ftLb": "3.75",
        "inLb": "45"
      },
      {
        "screwSize": "1/4\"",
        "ftLb": "9",
        "inLb": "108"
      },
      {
        "screwSize": "5/16\"",
        "ftLb": "18",
        "inLb": "216"
      },
      {
        "screwSize": "3/8\"",
        "ftLb": "32",
        "inLb": "384"
      },
      {
        "screwSize": "1/2\"",
        "ftLb": "80",
        "inLb": ""
      },
      {
        "screwSize": "5/8\"",
        "ftLb": "150",
        "inLb": ""
      },
      {
        "screwSize": "3/4\"",
        "ftLb": "270",
        "inLb": ""
      },
      {
        "screwSize": "7/8\"",
        "ftLb": "440",
        "inLb": ""
      },
      {
        "screwSize": "1\"",
        "ftLb": "650",
        "inLb": ""
      }
    ]
  },
  "folding": {
    "capacityRows": [
      {
        "line": "16",
        "tap": "12",
        "psi": "150",
        "bar": "10.3"
      },
      {
        "line": "18",
        "tap": "12",
        "psi": "150",
        "bar": "10.3"
      },
      {
        "line": "20",
        "tap": "12",
        "psi": "150",
        "bar": "10.3"
      },
      {
        "line": "24",
        "tap": "16",
        "psi": "150",
        "bar": "10.3"
      },
      {
        "line": "27",
        "tap": "16",
        "psi": "150",
        "bar": "10.3"
      },
      {
        "line": "30",
        "tap": "24",
        "psi": "150",
        "bar": "10.3"
      },
      {
        "line": "36",
        "tap": "24",
        "psi": "150",
        "bar": "10.3"
      },
      {
        "line": "42",
        "tap": "30",
        "psi": "150",
        "bar": "10.3"
      },
      {
        "line": "48",
        "tap": "30",
        "psi": "150",
        "bar": "10.3"
      },
      {
        "line": "54",
        "tap": "42",
        "psi": "100",
        "bar": "6.9"
      },
      {
        "line": "60",
        "tap": "42",
        "psi": "100",
        "bar": "6.9"
      },
      {
        "line": "66",
        "tap": "42",
        "psi": "100",
        "bar": "6.9"
      },
      {
        "line": "72",
        "tap": "48",
        "psi": "90",
        "bar": "6.2"
      },
      {
        "line": "78",
        "tap": "48",
        "psi": "70",
        "bar": "4.8"
      },
      {
        "line": "84",
        "tap": "48",
        "psi": "70",
        "bar": "4.8"
      }
    ],
    "procedureRows": [
      [
        "HTS-5214",
        "Folding Head Line Stop / Plant Series Fitting"
      ],
      [
        "HTS-5215",
        "Folding Head Line Stop / Pipeline Series Fitting"
      ],
      [
        "HTS-5903",
        "Folding Head Line Stop / Infrastructure Only"
      ],
      [
        "HTS-5904",
        "Folding Head Line Stop / JCM440 with pin type completion plug"
      ],
      [
        "HTS-5905",
        "Folding Head Line Stop / JCM440 with threaded completion plug"
      ]
    ],
    "setupChecks": [
      "Bring tape, sketch clearances, and confirm the equipment will physically fit.",
      "Walk the full line and look for branch connections feeding the section.",
      "Get available drawings, ISO, P&ID, or other client support documents.",
      "Complete HTS-5001 and the data sheet before job execution.",
      "Use Form 901.6 when a custom fitting is needed.",
      "Petrochemical work needs critical job review during quoting and before execution."
    ],
    "executionChecks": [
      "Install and align hot tap equipment, leak test, complete the tap, then measure the coupon to verify pipe ID.",
      "Install the FHLS machine, verify alignment, leak test, open the service valve, and equalize as needed.",
      "If possible, lower power unit pressure to 350 psi before lowering the folding head.",
      "Do not force the head. If it will not reach set dimension, remove the machine and contact Technical Support.",
      "Do not cut the isolated section until the folding head seal is verified as satisfactory.",
      "After client work is complete, equalize from upstream, retrieve the head, close/vent, remove equipment, and set the completion plug."
    ],
    "pccpChecks": [
      "Mark the saddle ID, remove the top saddle half, and chip concrete back to the steel cylinder.",
      "Grout the fitting and allow grout to set before torqueing straps.",
      "Cut/remove pre-stressing wires inside the fitting only after the saddle is installed.",
      "Polish the steel cylinder to aid gland sealing.",
      "Use soapy water on pipe and fitting gasket; do not use oil-base pipe lubricant.",
      "Leak test the gland before pouring grout between the gland and saddle."
    ]
  }
};
