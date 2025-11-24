/**
 * Report Templates for Offline Creation
 * 
 * This file contains the initial data structures for all report types.
 * Extracted from the web app report components to ensure offline reports
 * have the same structure as those created online.
 */

export interface ReportTemplateData {
    report_info: {
        jobInfo: {
            customer: string;
            address: string;
            date: string;
            technicians: string;
            jobNumber: string;
            substation: string;
            eqptLocation: string;
            identifier: string;
            userName: string;
        };
        environmental: {
            temperature: {
                fahrenheit: number;
                celsius: number;
                tcf: number;
            };
            humidity: number;
        };
        metadata: {
            status: string;
            reportType: string;
            version: string;
        };
        comments: string;
    };
    nameplate_data?: any;
    visual_mechanical?: any;
    insulation_resistance?: any;
    contact_resistance?: any;
    test_equipment?: any;
    [key: string]: any;
}

// Common visual inspection templates (NETA Standard sections)
const SWITCHGEAR_VISUAL_ITEMS = [
    { id: '7.1.1.A.1', description: 'Compare equipment nameplate data with drawings.', result: 'Select One' },
    { id: '7.1.1.A.2', description: 'Inspect physical, electrical, and mechanical condition.', result: 'Select One' },
    { id: '7.1.1.A.3', description: 'Inspect anchorage, alignment, grounding, and required area clearances.', result: 'Select One' },
    { id: '7.1.1.A.4', description: 'Verify unit is clean and all shipping bracing and loose parts removed.', result: 'Select One' },
    { id: '7.1.1.A.5', description: 'Compare mimic diagram and device labeling with drawings.', result: 'Select One' },
    { id: '7.1.1.A.6', description: 'Verify fuse and circuit breaker sizes and types correspond to drawings and coordination study.', result: 'Select One' },
    { id: '7.1.1.A.7', description: 'Verify CT and PT ratios correspond to drawings.', result: 'Select One' },
    { id: '7.1.1.A.8', description: 'Verify tight wiring connections and secure wiring for moving parts.', result: 'Select One' },
    { id: '7.1.1.A.9', description: 'Verify tightness of accessible bolted electrical connections by calibrated torque-wrench method or manufacturer data.', result: 'Select One' },
    { id: '7.1.1.A.10', description: 'Confirm correct operation/sequencing of electrical and mechanical interlock systems.', result: 'Select One' },
    { id: '7.1.1.A.11', description: 'Verify appropriate lubrication on moving current-carrying parts and sliding surfaces.', result: 'Select One' },
    { id: '7.1.1.A.12', description: 'Inspect insulators for damage or contamination.', result: 'Select One' },
    { id: '7.1.1.A.13', description: 'Verify correct barrier and shutter installation and operation.', result: 'Select One' },
    { id: '7.1.1.A.14', description: 'Exercise all active components.', result: 'Select One' },
    { id: '7.1.1.A.15', description: 'Inspect mechanical indicating devices for correct operation.', result: 'Select One' },
    { id: '7.1.1.A.16', description: 'Verify filters are in place and vents are clear.', result: 'Select One' },
    { id: '7.1.1.A.17', description: 'Visual/mechanical inspection of instrument transformers per Section 7.19.', result: 'Select One' },
    { id: '7.1.1.A.18', description: 'Visual/mechanical inspection of surge arresters per Section 7.19.', result: 'Select One' },
    { id: '7.1.1.A.19', description: 'Inspect control power transformers.', result: 'Select One' },
    { id: '7.1.1.A.20', description: '*Perform thermographic survey per Section 9.', result: 'Select One' }
];

const PANELBOARD_VISUAL_ITEMS = [
    { id: '7.1.2.A.1', description: 'Compare equipment nameplate data with drawings.', result: 'Select One' },
    { id: '7.1.2.A.2', description: 'Inspect physical, electrical, and mechanical condition.', result: 'Select One' },
    { id: '7.1.2.A.3', description: 'Inspect anchorage, alignment, grounding, and required area clearances.', result: 'Select One' },
    { id: '7.1.2.A.4', description: 'Verify the unit is clean and all shipping bracing and loose parts have been removed.', result: 'Select One' },
    { id: '7.1.2.A.5', description: 'Verify that fuse and circuit breaker sizes and types correspond to drawings and coordination study.', result: 'Select One' },
    { id: '7.1.2.A.6', description: 'Verify that wiring connections are tight and secure to prevent damage during operation of moving parts.', result: 'Select One' },
    { id: '7.1.2.A.7', description: 'Verify tightness of accessible bolted electrical connections by calibrated torque-wrench method. Use manufacturer data or Table 100.12.', result: 'Select One' },
    { id: '7.1.2.A.8', description: 'Inspect insulators for evidence of physical damage or contaminated surfaces.', result: 'Select One' },
    { id: '7.1.2.A.9', description: 'Verify correct barrier installation.', result: 'Select One' },
    { id: '7.1.2.A.10', description: 'Perform visual and mechanical inspection on surge protective devices.', result: 'Select One' },
    { id: '7.1.2.A.11', description: 'Exercise all active components.', result: 'Select One' },
    { id: '7.1.2.A.12', description: '*Perform thermographic survey in accordance with Section 9.', result: 'Select One' }
];

const TRANSFORMER_VISUAL_ITEMS = [
    { id: '7.2.2.A.1', description: 'Compare equipment nameplate data with drawings and specifications.', result: 'Select One' },
    { id: '7.2.2.A.2', description: 'Inspect physical and mechanical condition.', result: 'Select One' },
    { id: '7.2.2.A.3', description: 'Inspect impact recorder prior to unloading.', result: 'Select One' },
    { id: '7.2.2.A.4', description: 'Test dew point of tank gases. *Optional', result: 'Select One' },
    { id: '7.2.2.A.5', description: 'Inspect anchorage, alignment, and grounding.', result: 'Select One' },
    { id: '7.2.2.A.6', description: 'Verify the presence of PCB content labeling.', result: 'Select One' },
    { id: '7.2.2.A.7', description: 'Verify removal of any shipping bracing after placement.', result: 'Select One' },
    { id: '7.2.2.A.8', description: 'Verify the bushings are clean.', result: 'Select One' },
    { id: '7.2.2.A.9', description: 'Verify that alarm, control, and trip settings on temperature and level indicators are as specified.', result: 'Select One' },
    { id: '7.2.2.A.10', description: 'Verify operation of alarm, control, and trip circuits from temperature and level indicators, pressure relief device, gas accumulator, and fault pressure relay.', result: 'Select One' },
    { id: '7.2.2.A.11', description: 'Verify that cooling fans and pumps operate correctly and have appropriate overcurrent protection.', result: 'Select One' },
    { id: '7.2.2.A.12', description: 'Inspect bolted electrical connections for high resistance using low-resistance ohmmeter, calibrated torquewrench, or thermographic survey.', result: 'Select One' },
    { id: '7.2.2.A.13', description: 'Verify correct liquid level in tanks and bushings.', result: 'Select One' },
    { id: '7.2.2.A.14', description: 'Verify valves are in the correct operating position.', result: 'Select One' },
    { id: '7.2.2.A.15', description: 'Verify that positive pressure is maintained on gas-blanketed transformers.', result: 'Select One' },
    { id: '7.2.2.A.16', description: 'Perform inspections and mechanical tests as recommended by the manufacturer.', result: 'Select One' },
    { id: '7.2.2.A.17', description: 'Test load tap-changer in accordance with Section 7.12.3.', result: 'Select One' },
    { id: '7.2.2.A.18', description: 'Verify presence of transformer surge arresters.', result: 'Select One' },
    { id: '7.2.2.A.19', description: 'Verify de-energized tap-changer position is left as specified.', result: 'Select One' }
];

const CIRCUIT_BREAKER_VISUAL_ITEMS = [
    { id: '7.6.1.2.A.1', description: 'Compare equipment nameplate data with drawings and specifications.', result: 'Select One' },
    { id: '7.6.1.2.A.2', description: 'Inspect physical and mechanical condition.', result: 'Select One' },
    { id: '7.6.1.2.A.3', description: 'Inspect anchorage and alignment.', result: 'Select One' },
    { id: '7.6.1.2.A.4', description: 'Verify that all maintenance devices are available for servicing and operating the breaker.', result: 'Select One' },
    { id: '7.6.1.2.A.5', description: 'Verify the unit is clean.', result: 'Select One' },
    { id: '7.6.1.2.A.6', description: 'Verify the arc chutes are intact.', result: 'Select One' },
    { id: '7.6.1.2.A.7', description: 'Inspect moving and stationary contacts for condition and alignment.', result: 'Select One' },
    { id: '7.6.1.2.A.8', description: 'Verify that primary and secondary contact wipe and other dimensions vital to satisfactory operation of the breaker are correct.', result: 'Select One' },
    { id: '7.6.1.2.A.9', description: 'Perform all mechanical operator and contact alignment tests on both the breaker and its operating mechanism in accordance with manufacturer\'s published data.', result: 'Select One' },
    { id: '7.6.1.2.A.10.1', description: 'Use of a low-resistance ohmmeter in accordance with Section 7.6.1.2.B.1.', result: 'Select One' },
    { id: '7.6.1.2.A.11', description: 'Verify cell fit and element alignment.', result: 'Select One' },
    { id: '7.6.1.2.A.12', description: 'Verify racking mechanism operation.', result: 'Select One' },
    { id: '7.6.1.2.A.13', description: 'Verify appropriate lubrication on moving current-carrying parts and on moving and sliding surfaces.', result: 'Select One' },
    { id: '7.6.1.2.A.14', description: 'Perform adjustments for final protective device settings in accordance with coordination study provided by end user.', result: 'Select One' }
];

// Common insulation resistance structure for transformers
const TRANSFORMER_INSULATION_TESTS = {
    primaryToGround: {
        testVoltage: '5000V',
        unit: 'MΩ',
        readings: { halfMinute: '', oneMinute: '', tenMinute: '' },
        corrected: { halfMinute: '', oneMinute: '', tenMinute: '' },
        dielectricAbsorption: '',
        polarizationIndex: ''
    },
    secondaryToGround: {
        testVoltage: '1000V',
        unit: 'MΩ',
        readings: { halfMinute: '', oneMinute: '', tenMinute: '' },
        corrected: { halfMinute: '', oneMinute: '', tenMinute: '' },
        dielectricAbsorption: '',
        polarizationIndex: ''
    },
    primaryToSecondary: {
        testVoltage: '5000V',
        unit: 'MΩ',
        readings: { halfMinute: '', oneMinute: '', tenMinute: '' },
        corrected: { halfMinute: '', oneMinute: '', tenMinute: '' },
        dielectricAbsorption: '',
        polarizationIndex: ''
    },
    dielectricAbsorptionAcceptable: '',
    polarizationIndexAcceptable: ''
};

// Template data for each report type
export const REPORT_TEMPLATES: Record<string, Partial<ReportTemplateData>> = {
    // ==== SWITCHGEAR & PANELBOARDS ====
    'switchgear-switchboard-assemblies-ats25': {
        visual_mechanical: { items: SWITCHGEAR_VISUAL_ITEMS },
        insulation_resistance: {
            tests: Array(5).fill(null).map((_, i) => ({
                busSection: `Section ${i + 1}`,
                ag: '', bg: '', cg: '', ab: '', bc: '', ca: '', an: '', bn: '', cn: ''
            })),
            correctedTests: Array(5).fill(null).map((_, i) => ({
                busSection: `Section ${i + 1}`,
                ag: '', bg: '', cg: '', ab: '', bc: '', ca: '', an: '', bn: '', cn: ''
            }))
        },
        contact_resistance: {
            tests: Array(5).fill(null).map((_, i) => ({
                busSection: `Section ${i + 1}`,
                aPhase: '', bPhase: '', cPhase: '', neutral: '', ground: ''
            })),
            dielectricTests: Array(5).fill(null).map((_, i) => ({
                busSection: `Section ${i + 1}`,
                ag: '', bg: '', cg: '', result: ''
            })),
            dielectricUnit: 'µA',
            dielectricTestVoltage: '2.3 kVDC',
            dielectricDuration: '1 min.'
        }
    },

    'panelboard-assemblies-ats25': {
        visual_mechanical: { items: PANELBOARD_VISUAL_ITEMS },
        insulation_resistance: {
            tests: [
                { section: 'Phase to Phase', p1: '', p2: '', p3: '' },
                { section: 'Phase to Ground', p1: '', p2: '', p3: '' },
                { section: 'Phase to Neutral', p1: '', p2: '', p3: '' }
            ],
            correctedTests: [
                { section: 'Phase to Phase', p1: '', p2: '', p3: '' },
                { section: 'Phase to Ground', p1: '', p2: '', p3: '' },
                { section: 'Phase to Neutral', p1: '', p2: '', p3: '' }
            ]
        },
        contact_resistance: {
            tests: [{ busSection: 'Panelboard', aPhase: '', bPhase: '', cPhase: '', neutral: '', ground: '' }],
            dielectricTests: [{ busSection: 'Panelboard', ag: '', bg: '', cg: '', result: '' }],
            dielectricUnit: 'µA',
            dielectricTestVoltage: '2.3 kVDC',
            dielectricDuration: '1 min.'
        }
    },

    'switchgear-report': {
        visual_mechanical: { items: SWITCHGEAR_VISUAL_ITEMS },
        insulation_resistance: {
            tests: Array(3).fill(null).map((_, i) => ({
                busSection: `Section ${i + 1}`,
                ag: '', bg: '', cg: '', ab: '', bc: '', ca: ''
            }))
        }
    },

    'switchgear-panelboard-mts-report': {
        visual_mechanical: { items: SWITCHGEAR_VISUAL_ITEMS },
        insulation_resistance: {
            tests: Array(3).fill(null).map((_, i) => ({
                busSection: `Section ${i + 1}`,
                ag: '', bg: '', cg: ''
            }))
        }
    },

    'panelboard-report': {
        visual_mechanical: { items: PANELBOARD_VISUAL_ITEMS },
        insulation_resistance: {
            tests: [
                { section: 'Phase to Phase', p1: '', p2: '', p3: '' },
                { section: 'Phase to Ground', p1: '', p2: '', p3: '' }
            ]
        }
    },

    // ==== TRANSFORMERS ====
    'dry-type-transformer': {
        visual_mechanical: { items: TRANSFORMER_VISUAL_ITEMS },
        insulation_resistance: TRANSFORMER_INSULATION_TESTS
    },

    'liquid-filled-transformer': {
        visual_mechanical: { items: TRANSFORMER_VISUAL_ITEMS },
        insulation_resistance: TRANSFORMER_INSULATION_TESTS
    },

    'large-dry-type-transformer-report': {
        visual_mechanical: { items: TRANSFORMER_VISUAL_ITEMS },
        insulation_resistance: TRANSFORMER_INSULATION_TESTS
    },

    'large-dry-type-transformer-mts-report': {
        visual_mechanical: { items: TRANSFORMER_VISUAL_ITEMS },
        insulation_resistance: TRANSFORMER_INSULATION_TESTS
    },

    'large-dry-type-xfmr-mts-report': {
        visual_mechanical: { items: TRANSFORMER_VISUAL_ITEMS },
        insulation_resistance: TRANSFORMER_INSULATION_TESTS
    },

    'two-small-dry-typer-xfmr-ats-report': {
        visual_mechanical: { items: TRANSFORMER_VISUAL_ITEMS },
        insulation_resistance: TRANSFORMER_INSULATION_TESTS
    },

    'two-small-dry-typer-xfmr-mts-report': {
        visual_mechanical: { items: TRANSFORMER_VISUAL_ITEMS },
        insulation_resistance: TRANSFORMER_INSULATION_TESTS
    },

    'liquid-xfmr-visual-mts-report': {
        visual_mechanical: { items: TRANSFORMER_VISUAL_ITEMS }
    },

    // ==== CIRCUIT BREAKERS ====
    'low-voltage-circuit-breaker-electronic-trip-ats-report': {
        visual_mechanical: { items: CIRCUIT_BREAKER_VISUAL_ITEMS },
        insulation_resistance: {
            tests: [{ section: 'Primary', ag: '', bg: '', cg: '' }]
        }
    },

    'low-voltage-circuit-breaker-thermal-magnetic-ats-report': {
        visual_mechanical: { items: CIRCUIT_BREAKER_VISUAL_ITEMS },
        insulation_resistance: {
            tests: [{ section: 'Primary', ag: '', bg: '', cg: '' }]
        }
    },

    'low-voltage-circuit-breaker-electronic-trip-mts-report': {
        visual_mechanical: { items: CIRCUIT_BREAKER_VISUAL_ITEMS },
        contact_resistance: {
            tests: [{ phase: 'A', resistance: '' }, { phase: 'B', resistance: '' }, { phase: 'C', resistance: '' }]
        }
    },

    'low-voltage-circuit-breaker-thermal-magnetic-mts-report': {
        visual_mechanical: { items: CIRCUIT_BREAKER_VISUAL_ITEMS },
        contact_resistance: {
            tests: [{ phase: 'A', resistance: '' }, { phase: 'B', resistance: '' }, { phase: 'C', resistance: '' }]
        }
    },

    'medium-voltage-circuit-breaker-report': {
        visual_mechanical: { items: CIRCUIT_BREAKER_VISUAL_ITEMS },
        insulation_resistance: {
            tests: [{ section: 'Primary', ag: '', bg: '', cg: '', ab: '', bc: '', ca: '' }]
        }
    },

    'medium-voltage-circuit-breaker-mts-report': {
        visual_mechanical: { items: CIRCUIT_BREAKER_VISUAL_ITEMS },
        contact_resistance: {
            tests: [{ phase: 'A', resistance: '' }, { phase: 'B', resistance: '' }, { phase: 'C', resistance: '' }]
        }
    },

    // ==== CABLES & VLF ====
    'medium-voltage-vlf': {
        visual_mechanical: { items: [] },
        vlf_tests: {
            cables: [{ cableId: 'Cable 1', testVoltage: '', duration: '', result: '' }]
        }
    },

    'medium-voltage-vlf-mts-report': {
        visual_mechanical: { items: [] },
        vlf_tests: {
            cables: [{ cableId: 'Cable 1', testVoltage: '', duration: '', result: '' }]
        }
    },

    // ==== SWITCHES ====
    'low-voltage-switch-report': {
        visual_mechanical: { items: [] },
        contact_resistance: {
            tests: [{ pole: 'Pole 1', aPhase: '', bPhase: '', cPhase: '' }]
        }
    },

    '6-low-voltage-switch-maint-mts-report': {
        visual_mechanical: { items: [] },
        contact_resistance: {
            tests: [{ pole: 'Pole 1', resistance: '' }]
        }
    },

    'medium-voltage-switch-oil-report': {
        visual_mechanical: { items: [] },
        insulation_resistance: {
            tests: [{ section: 'Main Contacts', ag: '', bg: '', cg: '' }]
        }
    },

    '23-medium-voltage-switch-mts-report': {
        visual_mechanical: { items: [] },
        contact_resistance: {
            tests: [{ pole: 'Pole 1', aPhase: '', bPhase: '', cPhase: '' }]
        }
    },

    // ==== INSTRUMENT TRANSFORMERS ====
    'current-transformer-test-ats-report': {
        visual_mechanical: { items: [] },
        insulation_resistance: {
            tests: [{ winding: 'Primary to Secondary', resistance: '' }]
        }
    },

    '12-current-transformer-test-ats-report': {
        visual_mechanical: { items: [] },
        insulation_resistance: {
            tests: [{ winding: 'Primary to Secondary', resistance: '' }]
        }
    },

    '12-current-transformer-test-mts-report': {
        visual_mechanical: { items: [] },
        excitation_tests: {
            tests: [{ current: '', voltage: '' }]
        }
    },

    '13-voltage-potential-transformer-test-mts-report': {
        visual_mechanical: { items: [] },
        ratio_tests: {
            tests: [{ primary: '', secondary: '', ratio: '' }]
        }
    },

    // ==== MOTOR STARTERS & ATS ====
    '23-medium-voltage-motor-starter-mts-report': {
        visual_mechanical: { items: [] },
        contact_resistance: {
            tests: [{ contact: 'Main 1', resistance: '' }]
        }
    },

    'automatic-transfer-switch-ats-report': {
        visual_mechanical: { items: [] },
        transfer_time_tests: {
            tests: [{ source: 'Normal to Emergency', time: '' }]
        }
    },

    // ==== MISC & OTHER ====
    'metal-enclosed-busway': {
        visual_mechanical: { items: [] },
        insulation_resistance: {
            tests: [{ section: 'Section 1', ag: '', bg: '', cg: '' }]
        }
    },

    'low-voltage-panelboard-small-breaker-report': {
        visual_mechanical: { items: CIRCUIT_BREAKER_VISUAL_ITEMS },
        breaker_tests: {
            tests: [{ breaker: 'CB-1', result: '' }]
        }
    },

    'oil-inspection': {
        visual_mechanical: { items: TRANSFORMER_VISUAL_ITEMS },
        oil_quality: {
            color: '',
            dielectricStrength: '',
            moistureContent: '',
            acidity: ''
        }
    },

    'low-voltage-circuit-breaker-electronic-trip-ats-secondary-injection-report': {
        visual_mechanical: { items: CIRCUIT_BREAKER_VISUAL_ITEMS },
        insulation_resistance: {
            tests: [{ section: 'Primary', ag: '', bg: '', cg: '' }]
        }
    }
};

/**
 * Get the template data for a specific report type
 * Falls back to generic template if specific one not found
 */
export function getReportTemplate(reportType: string, jobData?: any): ReportTemplateData {
    const template = REPORT_TEMPLATES[reportType] || {
        // Generic fallback for undefined report types
        visual_mechanical: { items: [], generalComments: '' },
        insulation_resistance: { tests: [] },
        test_equipment: { equipment: [] }
    };

    return {
        report_info: {
            jobInfo: {
                customer: jobData?.customer_name || '',
                address: jobData?.address || '',
                date: new Date().toISOString().split('T')[0],
                technicians: '',
                jobNumber: jobData?.job_number || '',
                substation: '',
                eqptLocation: '',
                identifier: '',
                userName: ''
            },
            environmental: {
                temperature: {
                    fahrenheit: 68,
                    celsius: 20,
                    tcf: 1.0
                },
                humidity: 50
            },
            metadata: {
                status: 'PENDING',
                reportType: reportType,
                version: '1.0'
            },
            comments: ''
        },
        nameplate_data: {
            manufacturer: '',
            catalogNumber: '',
            serialNumber: '',
            type: '',
            manufacturingDate: ''
        },
        test_equipment: {
            equipment: [],
            comments: ''
        },
        ...template
    };
}
