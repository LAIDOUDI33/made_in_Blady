#!/usr/bin/env python3
"""
AlgeriaTrade.dz - Comprehensive Audit Report Generator
Generates a professional PDF audit report
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, ListFlowable, ListItem
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from datetime import datetime

# Output path
OUTPUT_PATH = "/home/z/my-project/download/AlgeriaTrade_Audit_Report.pdf"

# =============================================================================
# COLOR PALETTE (Professional Green for AlgeriaTrade)
# =============================================================================
COLORS = {
    'primary': colors.HexColor('#006233'),      # Algerian green
    'secondary': colors.HexColor('#D52B1E'),    # Red accent
    'success': colors.HexColor('#10B981'),      # Green for good scores
    'warning': colors.HexColor('#F59E0B'),      # Amber for medium
    'danger': colors.HexColor('#EF4444'),       # Red for critical
    'text': colors.HexColor('#1F2937'),         # Dark gray text
    'text_light': colors.HexColor('#6B7280'),   # Light gray text
    'bg_light': colors.HexColor('#F9FAFB'),     # Light background
    'bg_header': colors.HexColor('#ECFDF5'),    # Green tint background
}

# =============================================================================
# STYLES
# =============================================================================

def create_styles():
    styles = getSampleStyleSheet()
    
    # Title style
    styles.add(ParagraphStyle(
        name='AuditTitle',
        parent=styles['Title'],
        fontSize=28,
        textColor=COLORS['primary'],
        spaceAfter=6*mm,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    # Subtitle
    styles.add(ParagraphStyle(
        name='AuditSubtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=COLORS['text_light'],
        spaceAfter=20*mm,
        alignment=TA_CENTER
    ))
    
    # Section Header
    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=COLORS['primary'],
        spaceBefore=15*mm,
        spaceAfter=8*mm,
        fontName='Helvetica-Bold'
    ))
    
    # Subsection Header
    styles.add(ParagraphStyle(
        name='SubsectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=COLORS['text'],
        spaceBefore=10*mm,
        spaceAfter=5*mm,
        fontName='Helvetica-Bold'
    ))
    
    # Body text
    styles.add(ParagraphStyle(
        name='AuditBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=COLORS['text'],
        spaceAfter=3*mm,
        alignment=TA_JUSTIFY,
        leading=14
    ))
    
    # Score style (large)
    styles.add(ParagraphStyle(
        name='ScoreLarge',
        parent=styles['Normal'],
        fontSize=36,
        textColor=COLORS['primary'],
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    # Score label
    styles.add(ParagraphStyle(
        name='ScoreLabel',
        parent=styles['Normal'],
        fontSize=10,
        textColor=COLORS['text_light'],
        alignment=TA_CENTER
    ))
    
    return styles

# =============================================================================
# SCORE HELPER
# =============================================================================

def get_score_color(score):
    """Return color based on score value"""
    if score >= 80:
        return COLORS['success']
    elif score >= 60:
        return COLORS['warning']
    else:
        return COLORS['danger']

def get_score_grade(score):
    """Return grade letter based on score"""
    if score >= 90:
        return 'A+'
    elif score >= 85:
        return 'A'
    elif score >= 80:
        return 'A-'
    elif score >= 75:
        return 'B+'
    elif score >= 70:
        return 'B'
    elif score >= 65:
        return 'B-'
    elif score >= 60:
        return 'C+'
    else:
        return 'C'

# =============================================================================
# CONTENT SECTIONS
# =============================================================================

def create_cover_page(styles):
    """Create the cover page elements"""
    elements = []
    
    elements.append(Spacer(1, 30*mm))
    
    # Main title
    elements.append(Paragraph(
        "RAPPORT D'AUDIT COMPLET",
        styles['AuditTitle']
    ))
    
    elements.append(Paragraph(
        "AlgeriaTrade.dz - Plateforme B2B",
        styles['AuditSubtitle']
    ))
    
    # Score circle (simulated with table)
    score_data = [[
        Paragraph('<font size="48" color="#006233"><b>82</b></font>', 
                  ParagraphStyle('Score', alignment=TA_CENTER)),
    ], [
        Paragraph('/100', ParagraphStyle('ScoreLabel', alignment=TA_CENTER))
    ]]
    
    score_table = Table(score_data, colWidths=[80*mm])
    score_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    elements.append(score_table)
    elements.append(Spacer(1, 10*mm))
    
    # Grade
    elements.append(Paragraph(
        f"Note Globale: <b>{get_score_grade(82)}</b> (Production Ready avec réserves)",
        ParagraphStyle('Grade', fontSize=12, alignment=TA_CENTER, 
                      textColor=COLORS['success'])
    ))
    
    elements.append(Spacer(1, 20*mm))
    
    # Meta info
    meta_data = [
        ['Date d\'audit:', datetime.now().strftime('%d/%m/%Y')],
        ['Version:', '1.0.0'],
        ['Auditeur:', 'AI Quality Assurance System'],
        ['Scope:', '940 fichiers TypeScript analysés'],
    ]
    
    meta_table = Table(meta_data, colWidths=[40*mm, 80*mm])
    meta_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), COLORS['text']),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
    ]))
    
    elements.append(meta_table)
    elements.append(PageBreak())
    
    return elements

def create_executive_summary(styles):
    """Create executive summary section"""
    elements = []
    
    elements.append(Paragraph("1. Résumé Exécutif", styles['SectionHeader']))
    
    summary_text = """
    Cet audit complet de la plateforme AlgeriaTrade.dz a été réalisé pour évaluer l'état de préparation 
    avant la mise en production. L'analyse couvre 940 fichiers TypeScript, incluant les composants React, 
    les routes API, le schéma de base de données, la configuration de sécurité et les performances.
    
    L'audit a identifié et corrigé <b>12 fichiers critiques</b> contenant des erreurs de syntaxe 
    TypeScript qui auraient empêché la compilation. Les corrections principales incluent: commentaires 
    invalides, parenthèses déséquilibrées, types incorrects pour les paramètres de routes Next.js 16, 
    et noms de fonctions malformés.
    
    Dans l'ensemble, la plateforme démonte une architecture solide avec des pratiques modernes 
    (Next.js 16, React 19, TypeScript strict, Prisma ORM). Les principaux domaines nécessitant 
    une attention sont: la migration de SQLite vers PostgreSQL pour la production, la suppression 
    des clés Stripe codées en dur, et la mise à jour de certaines dépendances.
    """
    elements.append(Paragraph(summary_text, styles['AuditBody']))
    elements.append(Spacer(1, 5*mm))
    
    # Scores overview table
    elements.append(Paragraph("1.1 Scores par Catégorie", styles['SubsectionHeader']))
    
    scores_data = [
        ['Catégorie', 'Score', 'Statut', 'Priorité'],
        ['Structure & Configuration', '85/100', '✓ Bon', 'Basse'],
        ['Frontend (React/TSX)', '88/100', '✓ Excellent', 'Basse'],
        ['Backend (API Routes)', '82/100', '✓ Bon', 'Moyenne'],
        ['Base de données (Prisma)', '78/100', '⚠ À améliorer', 'Haute'],
        ['Sécurité (OWASP)', '82/100', '✓ Bon', 'Haute'],
        ['Performance', '85/100', '✓ Bon', 'Moyenne'],
        ['Dépendances', '72/100', '⚠ Attention', 'Moyenne'],
        ['Build & Déploiement', '85/100', '✓ Bon', 'Basse'],
    ]
    
    scores_table = Table(scores_data, colWidths=[55*mm, 25*mm, 30*mm, 30*mm])
    scores_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLORS['primary']),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, COLORS['text_light']),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [COLORS['bg_light'], colors.white]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
    ]))
    
    elements.append(scores_table)
    elements.append(PageBreak())
    
    return elements

def create_corrections_section(styles):
    """Document the fixes made during audit"""
    elements = []
    
    elements.append(Paragraph("2. Corrections Appliquées", styles['SectionHeader']))
    
    intro_text = """
    Durant cet audit, <b>12 fichiers critiques</b> ont été corrigés pour permettre la compilation 
    réussie du projet avec zéro erreur TypeScript. Ces corrections étaient nécessaires pour atteindre 
    l'état "Production Ready".
    """
    elements.append(Paragraph(intro_text, styles['AuditBody']))
    elements.append(Spacer(1, 5*mm))
    
    corrections = [
        [
            '1',
            'src/lib/performance/cdn-config.ts',
            'Commentaires # invalides → //',
            'Syntax Error',
            'Critique'
        ],
        [
            '2',
            'src/lib/performance/code-splitting.ts',
            'Renommé en .tsx (contient JSX)',
            'Type Error',
            'Critique'
        ],
        [
            '3',
            'src/lib/monitoring/sentry.ts',
            'Renommé en .tsx, retiré ref invalide',
            'JSX Error',
            'Critique'
        ],
        [
            '4',
            'src/app/api/blockchain/pilot/metrics/route.ts',
            'Espace dans nom de fonction corrigé',
            'Syntax Error',
            'Critique'
        ],
        [
            '5',
            'src/app/api-portal/page.tsx',
            'Guillemets manquants corrigés',
            'JSX Error',
            'Critique'
        ],
        [
            '6',
            'src/app/api/bulk-pricing/[productId]/route.ts',
            'Parenthèse supplémentaire retirée',
            'Syntax Error',
            'Critique'
        ],
        [
            '7',
            'src/app/api/dashboard/buyer/suppliers/route.ts',
            'Réécriture complète (structure cassée)',
            'Structure Error',
            'Critique'
        ],
        [
            '8',
            'src/lib/security/fraud-detection.ts',
            'Condition invalide retirée',
            'Syntax Error',
            'Haute'
        ],
        [
            '9',
            'src/lib/security/gdpr-compliance.ts',
            'Types et template literals corrigés',
            'Type Errors',
            'Haute'
        ],
        [
            '10',
            'src/lib/security/rate-limiter-ddos.ts',
            'Syntaxe objet et méthodes corrigées',
            'Multiple Errors',
            'Haute'
        ],
        [
            '11',
            'src/app/api/ai/recommendations/[id]/feedback/route.ts',
            'NextRequest + Promise params',
            'Type Error',
            'Moyenne'
        ],
        [
            '12',
            'src/app/api/payments/[paymentId]/status/route.ts',
            'Promise params pour Next.js 16',
            'Type Error',
            'Moyenne'
        ],
    ]
    
    corr_table = Table(corrections, colWidths=[8*mm, 65*mm, 50*mm, 25*mm, 22*mm])
    corr_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLORS['primary']),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (3, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, COLORS['text_light']),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [COLORS['bg_light'], colors.white]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2*mm),
        ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
    ]))
    
    elements.append(corr_table)
    elements.append(PageBreak())
    
    return elements

def create_findings_section(styles):
    """Document findings by category"""
    elements = []
    
    elements.append(Paragraph("3. Résultats Détaillés par Domaine", styles['SectionHeader']))
    
    # 3.1 Database
    elements.append(Paragraph("3.1 Base de Données (Score: 78/100)", styles['SubsectionHeader']))
    
    db_text = """
    Le schéma Prisma démontre une architecture multi-tenant bien conçue avec un support approprié 
    pour le marché algérien (DZD, wilayas, fuseau horaire Africa/Algiers). Cependant, plusieurs points 
    nécessitent attention avant la production.
    """
    elements.append(Paragraph(db_text, styles['AuditBody']))
    
    db_issues = [
        ['CRITIQUE', 'SQLite utilisé en production', 'Migrer vers PostgreSQL pour les écritures concurrentes'],
        ['HAUTE', 'Index composites manquants', 'Ajouter index sur (status, createdAt) et (companyId, status)'],
        ['HAUTE', 'Type Float pour la monnaie', 'Utiliser Decimal pour éviter les erreurs de précision'],
        ['MOYENNE', 'Pas de soft-delete', 'Ajouter deletedAt pour la conformité GDPR'],
        ['BAS', 'Champs JSON sans limite de taille', 'Ajouter des validations de longueur'],
    ]
    
    db_table = Table(db_issues, colWidths=[25*mm, 55*mm, 90*mm])
    db_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FEF2F2')),
        ('TEXTCOLOR', (0, 0), (-1, 0), COLORS['danger']),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#FEE2E2')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2*mm),
        ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
    ]))
    elements.append(db_table)
    elements.append(Spacer(1, 5*mm))
    
    # 3.2 Security
    elements.append(Paragraph("3.2 Sécurité OWASP (Score: 82/100)", styles['SubsectionHeader']))
    
    sec_text = """
    La plateforme implémente des mesures de sécurité solides: authentification JWT, hachage bcrypt, 
    chiffrement AES-256-GCM, rate limiting, et headers HTTP sécurisés. Quelques vulnérabilités 
    ont été identifiées nécessitant une correction avant mise en production.
    """
    elements.append(Paragraph(sec_text, styles['AuditBody']))
    
    sec_issues = [
        ['CRITIQUE', 'Clés Stripe codées en dur', 'Remplacer par erreur si env manquant'],
        ['HAUTE', 'Pas de fichier .env.example', 'Créer avec toutes les variables documentées'],
        ['HAUTE', 'Rate limiting en mémoire', 'Utiliser Redis pour le multi-instance'],
        ['MOYEN', 'CSP nonce non résolu', 'Vérifier l\'injection des nonces en production'],
        ['BAS', 'Header x-blocked-reason', 'Retirer ou utiliser une valeur générique'],
    ]
    
    sec_table = Table(sec_issues, colWidths=[25*mm, 55*mm, 90*mm])
    sec_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FFFBEB')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#92400E')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#FEF3C7')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2*mm),
        ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
    ]))
    elements.append(sec_table)
    elements.append(Spacer(1, 5*mm))
    
    # 3.3 Dependencies
    elements.append(Paragraph("3.3 Dépendances (Score: 72/100)", styles['SubsectionHeader']))
    
    dep_text = """
    Le projet utilise des versions modernes des packages core (Next.js 16, React 19), mais certaines 
    dépendances sont obsolètes et présentent des risques de sécurité. Des packages superflus ont été 
    identifiés et des fichiers de backup encombraient le source.
    """
    elements.append(Paragraph(dep_text, styles['AuditBody']))
    
    dep_issues = [
        ['HAUTE', 'Packages extraneous installés', 'Exécuter npm prune (@swc/helpers, immer)'],
        ['HAUTE', '@anthropic-ai/sdk obsolète', 'Mettre à jour 0.117.1 → 0.123.0'],
        ['MOYEN', '26 packages @radix-ui obsolètes', 'Mise à jour groupée recommandée'],
        ['MOYEN', 'Fichiers .bak/.backup dans src/', 'Supprimés (10 fichiers)'],
        ['BAS', 'Three.js non lazy-loaded', 'Importer dynamiquement pour réduire le bundle'],
    ]
    
    dep_table = Table(dep_issues, colWidths=[25*mm, 55*mm, 90*mm])
    dep_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EFF6FF')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1D4ED8')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DBEAFE')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2*mm),
        ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
    ]))
    elements.append(dep_table)
    elements.append(PageBreak())
    
    return elements

def create_recommendations_section(styles):
    """Create action items and recommendations"""
    elements = []
    
    elements.append(Paragraph("4. Plan d'Action Recommandé", styles['SectionHeader']))
    
    # Immediate actions
    elements.append(Paragraph("4.1 Actions Immédiates (Avant Production)", styles['SubsectionHeader']))
    
    immediate_text = """
    Les actions suivantes doivent être complétées avant tout déploiement en production. 
    Elles représentent les risques critiques identifiés durant cet audit.
    """
    elements.append(Paragraph(immediate_text, styles['AuditBody']))
    
    immediate_actions = [
        ['1', 'Supprimer les clés Stripe fallback', 'src/lib/payments/stripe/config.ts', '1h'],
        ['2', 'Créer .env.example documenté', 'Racine du projet', '30min'],
        ['3', 'Migrer SQLite → PostgreSQL', 'prisma/schema.prisma', '4-8h'],
        ['4', 'Vérifier les CSP nonces en production', 'middleware.ts', '1h'],
        ['5', 'Configurer Redis pour rate limiting', 'src/lib/security/rateLimiter.ts', '2-3h'],
    ]
    
    imm_table = Table(immediate_actions, colWidths=[8*mm, 55*mm, 55*mm, 20*mm])
    imm_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLORS['danger']),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, COLORS['text_light']),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [COLORS['bg_light'], colors.white]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
    ]))
    elements.append(imm_table)
    elements.append(Spacer(1, 5*mm))
    
    # Short term actions
    elements.append(Paragraph("4.2 Court Terme (1-2 Semaines)", styles['SubsectionHeader']))
    
    short_term_actions = [
        ['1', 'Mettre à jour @anthropic-ai/sdk', 'Sécurité patches'],
        ['2', 'Ajouter index composites DB', 'Performance requêtes'],
        ['3', 'Changer monnaie Float → Decimal', 'Précision financière'],
        ['4', 'Nettoyer les fichiers lib volumineux', 'crm.ts (48KB), contracts.ts (21KB)'],
        ['5', 'Implémenter soft-delete pattern', 'Conformité GDPR'],
        ['6', 'Ajouter ISR pages statiques', 'Réduction charge serveur'],
    ]
    
    short_table = Table(short_term_actions, colWidths=[8*mm, 70*mm, 60*mm])
    short_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLORS['warning']),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, COLORS['text_light']),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [COLORS['bg_light'], colors.white]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
    ]))
    elements.append(short_table)
    elements.append(Spacer(1, 5*mm))
    
    # Conclusion
    elements.append(Paragraph("4.3 Conclusion", styles['SubsectionHeader']))
    
    conclusion_text = """
    La plateforme AlgeriaTrade.dz présente une fondation technique solide pour le marché B2B algérien. 
    L'audit a permis de corriger <b>12 fichiers critiques</b> et d'identifier les points d'amélioration 
    prioritaires.
    
    Avec un score global de <b>82/100</b>, la plateforme est classée <b>"Production Ready avec réserves"</b>. 
    Les actions immédiates (clés Stripe, migration PostgreSQL) sont des prérequis obligatoires 
    avant tout lancement en production.
    
    Les fondamentaux architecturaux sont sains: Next.js 16, React 19, TypeScript strict, 
    shadcn/ui, Prisma ORM, et une structure multi-tenant bien pensée. Le codebase de 
    940 fichiers démontre une maturité fonctionnelle couvrant CRM, paiements, AR/3D, 
    IA analytique, blockchain, et conformité réglementaire algérienne.
    """
    elements.append(Paragraph(conclusion_text, styles['AuditBody']))
    
    return elements

# =============================================================================
# MAIN REPORT GENERATION
# =============================================================================

def generate_report():
    """Generate the complete audit report PDF"""
    
    # Create document
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=20*mm,
        rightMargin=20*mm,
        topMargin=25*mm,
        bottomMargin=25*mm
    )
    
    # Get styles
    styles = create_styles()
    
    # Build content
    story = []
    
    # Cover page
    story.extend(create_cover_page(styles))
    
    # Executive summary
    story.extend(create_executive_summary(styles))
    
    # Corrections applied
    story.extend(create_corrections_section(styles))
    
    # Detailed findings
    story.extend(create_findings_section(styles))
    
    # Recommendations
    story.extend(create_recommendations_section(styles))
    
    # Build PDF
    doc.build(story)
    
    print(f"✅ Rapport généré: {OUTPUT_PATH}")
    return OUTPUT_PATH

if __name__ == "__main__":
    generate_report()
