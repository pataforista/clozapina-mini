/**
 * engine.js - Core Clinical Logic for Clozapine Monitoring (CLZ-Mini-PWA)
 * Based on 2024-2025 Guidelines (FDA REMS Update & Delphi Consensus)
 */

export const CLINICAL_RULES = {
    // Neutropenia Thresholds (ANC in k/ul)
    ANC: {
        NORMAL: { START: 1.5, WARN: 1.5, CRITICAL: 1.0 },
        BEN: { START: 1.0, WARN: 1.0, CRITICAL: 0.5 }
    },
    // Side Effect Severity Thresholds
    SIDE_EFFECTS: {
        CONSTIPATION_MAX: 3, // Above this, risk of Ileus
        SIALORRHEA_MAX: 3,
        SOMNOLENCE_MAX: 4
    },
    // CYP1A2 Interaction Factors
    INTERACTIONS: {
        SMOKING_FACTOR: 2.0, // Smokers need ~double dose
        CAFFEINE_LIMIT: 3,    // Trow warning if > 3 cups/day
        FLUVOXAMINE_REDUCTION: 0.25 // Reduce dose to 25% (reduction of 75%)
    }
};

/**
 * Analyzes ANC levels and returns a status object
 */
export function analyzeANC(anc, isBEN = false) {
    const limits = isBEN ? CLINICAL_RULES.ANC.BEN : CLINICAL_RULES.ANC.NORMAL;

    if (anc < limits.CRITICAL) {
        return {
            status: 'CRITICAL',
            color: 'var(--bad)',
            message: 'RIESGO DE AGRANULOCITOSIS. Descontinuar inmediatamente.',
            action: 'Emergencia médica. No omitir reporte.'
        };
    }

    if (anc < limits.WARN) {
        return {
            status: 'WARNING',
            color: 'var(--warn)',
            message: 'Neutropenia leve detectada.',
            action: 'Monitoreo diario requerido hasta recuperación > 1.5.'
        };
    }

    return {
        status: 'OK',
        color: 'var(--ok)',
        message: 'Niveles de ANC dentro de rango seguro.',
        action: 'Continuar monitoreo de rutina.'
    };
}

/**
 * Checks for clinical red flags in side effects
 */
export function auditSideEffects(effects) {
    const alerts = [];

    if (effects.constipation >= CLINICAL_RULES.SIDE_EFFECTS.CONSTIPATION_MAX) {
        alerts.push({
            type: 'GI_Ileo',
            title: 'RIESGO DE ÍLEO',
            severity: 'HIGH',
            message: 'Estreñimiento severo detectado. Alto riesgo de obstrucción intestinal.',
            advice: 'Iniciar laxantes (Senna/Docusate). CONTRAINDICADO el Psyllium.'
        });
    }

    if (effects.fever) {
        alerts.push({
            type: 'Infection_Myocarditis',
            title: 'ALERTA DE FIEBRE',
            severity: 'CRITICAL',
            message: 'Fiebre detectada durante el tratamiento.',
            advice: 'Descartar infección neutropénica o Miocarditis. Solicitar ANC, CRP y Troponina.'
        });
    }

    if (effects.sialorrhea >= CLINICAL_RULES.SIDE_EFFECTS.SIALORRHEA_MAX) {
        alerts.push({
            type: 'Sialorrhea',
            title: 'Sialorrea Significativa',
            severity: 'MEDIUM',
            message: 'Exceso de salivación con riesgo de aspiración nocturna.',
            advice: 'Considerar Atropina tópica 1% (gotas) o Ipratropio spray.'
        });
    }

    return alerts;
}

/**
 * Detects CYP1A2 interactions based on patient habits
 */
export function checkInteractions(habits) {
    const findings = [];

    if (habits.smokingCessation) {
        findings.push({
            risk: 'TOXICIDAD AGUDA',
            message: 'Cese de tabaquismo detectado.',
            justification: 'Los niveles de clozapina pueden aumentar 2-3 veces en 6-12 días.',
            action: 'Reducción inmediata de dosis (~30-50%) requerida.'
        });
    }

    if (habits.caffeineIntake > CLINICAL_RULES.INTERACTIONS.CAFFEINE_LIMIT) {
        findings.push({
            risk: 'POTENCIACIÓN',
            message: 'Consumo alto de cafeína.',
            justification: 'La cafeína inhibe el metabolismo de clozapina via CYP1A2.',
            action: 'Mantener consumo constante; evitar fluctuaciones bruscas.'
        });
    }

    if (habits.fluvox) {
        findings.push({
            risk: 'INTERACCIÓN MAYOR',
            message: 'Uso de Fluvoxamina detectado.',
            justification: 'Inhibidor potente de CYP1A2; puede aumentar niveles de clozapina 5-10 veces.',
            action: 'REDUCCIÓN CRÍTICA DE DOSIS (~75-90%) requerida bajo supervisión.'
        });
    }

    return findings;
}
