// ============================================
// Advanced Reporting System - Generator Engine
// AlgeriaTrade.dz B2B Platform
// ============================================

import { db } from '@/lib/db';
import { 
  ReportConfig, 
  ReportResult, 
  ReportData, 
  ChartConfig,
  ReportPeriod,
  ALGERIAN_WILAYAS 
} from './types';
import { randomUUID } from 'crypto';

/**
 * Main report generator class
 * Handles generation of all report types with data aggregation and insights
 */
export class ReportGenerator {
  
  /**
   * Generate a complete report based on configuration
   * @param config - Report configuration
   * @param userId - ID of user requesting the report
   * @returns Complete report result with data and metadata
   */
  async generateReport(config: ReportConfig, userId: string): Promise<ReportResult> {
    const startTime = Date.now();
    
    try {
      let data: ReportData;
      
      // Route to appropriate generator based on report type
      switch (config.type) {
        case 'sales_overview':
          data = await this.generateSalesOverview(config);
          break;
        case 'product_performance':
          data = await this.generateProductPerformance(config);
          break;
        case 'supplier_analytics':
          data = await this.generateSupplierAnalytics(config);
          break;
        case 'buyer_behavior':
          data = await this.generateBuyerBehavior(config);
          break;
        case 'rfq_analysis':
          data = await this.generateRFQAnalysis(config);
          break;
        case 'revenue_by_category':
          data = await this.generateRevenueByCategory(config);
          break;
        case 'geographic_distribution':
          data = await this.generateGeographicDistribution(config);
          break;
        case 'payment_methods':
          data = await this.generatePaymentMethodsReport(config);
          break;
        case 'user_growth':
          data = await this.generateUserGrowthReport(config);
          break;
        case 'inventory_status':
          data = await this.generateInventoryStatusReport(config);
          break;
        case 'custom':
          data = await this.generateCustomReport(config);
          break;
        default:
          throw new Error(`Unknown report type: ${config.type}`);
      }
      
      const processingTime = Date.now() - startTime;
      
      // Apply limit to table rows if specified
      if (config.limit && config.limit < data.table.rows.length) {
        data.table.rows = data.table.rows.slice(0, config.limit);
      }
      
      return {
        id: randomUUID(),
        config,
        generatedAt: new Date(),
        generatedBy: userId,
        status: 'completed',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiry
        metadata: {
          recordCount: data.table.rows.length,
          processingTimeMs: processingTime,
        },
        data,
      };
    } catch (error) {
      console.error('Report generation error:', error);
      
      return {
        id: randomUUID(),
        config,
        generatedAt: new Date(),
        generatedBy: userId,
        status: 'failed',
        expiresAt: new Date(),
        metadata: {
          recordCount: 0,
          processingTimeMs: Date.now() - startTime,
        },
        data: this.emptyReport(),
      };
    }
  }

  // ============================================
  // REPORT GENERATORS
  // ============================================

  /**
   * Generate sales overview report
   * Includes revenue trends, order statistics, and conversion metrics
   */
  private async generateSalesOverview(config: ReportConfig): Promise<ReportData> {
    const { startDate, endDate } = this.getDateRange(config.period, config.dateRange);
    
    // Query orders with related data
    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...(config.filters?.status?.length && { status: { in: config.filters.status as any[] } }),
      },
      include: {
        items: { include: { product: { include: { category: true } } } },
        buyer: { select: { id: true, firstName: true, lastName: true, wilaya: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: config.limit || 500,
    });
    
    // Calculate key metrics
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const completedOrders = orders.filter(o => o.status === 'DELIVERED').length;
    const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;
    
    // Group daily sales for trend analysis
    const dailySales = this.groupByDateField(orders, 'createdAt', 'totalAmount');
    const dailyOrders = this.groupByDateCount(orders, 'createdAt');
    
    // Status distribution
    const statusDistribution = this.countByField(orders, 'status');
    
    // Revenue by payment method
    const revenueByPayment = this.aggregateByField(orders, 'paymentMethod', 'totalAmount');
    
    return {
      summary: {
        totalRevenue: `${totalRevenue.toFixed(2)} DZD`,
        totalOrders: orders.length.toString(),
        averageOrderValue: `${avgOrderValue.toFixed(2)} DZD`,
        completionRate: orders.length > 0 ? `${((completedOrders / orders.length) * 100).toFixed(1)}%` : 'N/A',
        completedOrders: completedOrders.toString(),
        pendingOrders: pendingOrders.toString(),
        cancelledOrders: cancelledOrders.toString(),
        periodStart: startDate.toLocaleDateString('fr-FR'),
        periodEnd: endDate.toLocaleDateString('fr-FR'),
      },
      charts: [
        {
          type: 'line',
          title: "Évolution des Ventes Quotidiennes",
          data: Object.entries(dailySales).map(([date, amount]) => ({
            date,
            revenu: Number(amount),
            commandes: dailyOrders[date] || 0,
          })),
          options: { 
            yAxis: { label: 'Montant (DZD)' },
            xAxis: { label: 'Date' },
          },
        },
        {
          type: 'pie',
          title: 'Répartition par Statut de Commande',
          data: statusDistribution.map(([name, value]) => ({ name, value })),
        },
        {
          type: 'bar',
          title: 'Revenus par Mode de Paiement',
          data: revenueByPayment.map(([method, amount]) => ({
            name: method || 'Inconnu',
            montant: Number(amount),
          })),
        },
      ],
      table: {
        headers: ['N° Commande', 'Date', 'Client', 'Montant', 'Statut', 'Paiement', 'Wilaya'],
        rows: orders.map(o => [
          o.orderNumber,
          o.createdAt.toLocaleDateString('fr-FR'),
          `${o.buyer.firstName} ${o.buyer.lastName}`,
          `${Number(o.totalAmount).toFixed(2)} DZD`,
          o.status,
          o.paymentMethod || '-',
          o.buyer.wilaya || '-',
        ]),
      },
      insights: this.generateSalesInsights(orders, totalRevenue, avgOrderValue),
    };
  }

  /**
   * Generate product performance report
   * Analyzes product views, favorites, orders, and ratings
   */
  private async generateProductPerformance(config: ReportConfig): Promise<ReportData> {
    const { startDate, endDate } = this.getDateRange(config.period, config.dateRange);
    
    const products = await db.product.findMany({
      where: {
        ...(config.filters?.categories?.length && { categoryId: { in: config.filters.categories } }),
        status: 'published',
      },
      include: {
        _count: { select: { orderItems: true, favorites: true, reviews: true } },
        category: { select: { name: true } },
        company: { select: { name: true } },
      },
      take: config.limit || 100,
      orderBy: { viewCount: 'desc' },
    });
    
    // Get order items for revenue calculation
    const productIds = products.map(p => p.id);
    const orderItems = await db.orderItem.findMany({
      where: {
        productId: { in: productIds },
        order: { createdAt: { gte: startDate, lte: endDate } },
      },
      include: { product: { select: { id: true } } },
    });
    
    // Calculate revenue per product
    const productRevenue: Record<string, number> = {};
    orderItems.forEach(item => {
      productRevenue[item.productId] = (productRevenue[item.productId] || 0) + Number(item.totalPrice);
    });
    
    // Category distribution
    const categoryStats = this.countByField(products, 'category.name');
    
    // Top performers
    const topProducts = products.slice(0, 10).map(p => ({
      name: p.name.length > 30 ? p.name.substring(0, 30) + '...' : p.name,
      vues: p.viewCount,
      favoris: p._count.favorites,
      commandes: p._count.orderItems,
      revenu: productRevenue[p.id] || 0,
    }));
    
    return {
      summary: {
        totalProduits: products.length.toString(),
        vuesTotales: products.reduce((s, p) => s + p.viewCount, 0).toString(),
        favorisTotaux: products.reduce((s, p) => s + p._count.favorites, 0).toString(),
        revenuTotal: `${Object.values(productRevenue).reduce((a, b) => a + b, 0).toFixed(2)} DZD`,
        moyenneVues: Math.round(products.reduce((s, p) => s + p.viewCount, 0) / products.length).toString(),
      },
      charts: [
        {
          type: 'bar',
          title: 'Top 10 Produits les Plus Vus',
          data: topProducts.map(p => ({ ...p, revenu: Number(p.revenu) })),
          options: { horizontal: true },
        },
        {
          type: 'pie',
          title: 'Répartition par Catégorie',
          data: categoryStats.map(([name, value]) => ({ name, value })),
        },
        {
          type: 'scatter',
          title: 'Correlation Vues vs Commandes',
          data: products.slice(0, 50).map(p => ({
            x: p.viewCount,
            y: p._count.orderItems,
            name: p.name.substring(0, 20),
          })),
        },
      ],
      table: {
        headers: ['Produit', 'Catégorie', 'Fournisseur', 'Vues', 'Favoris', 'Commandes', 'Revenu'],
        rows: products.map(p => [
          p.name,
          p.category.name,
          p.company.name,
          p.viewCount.toString(),
          p._count.favorites.toString(),
          p._count.orderItems.toString(),
          `${(productRevenue[p.id] || 0).toFixed(2)} DZD`,
        ]),
      },
      insights: this.generateProductInsights(products, productRevenue),
    };
  }

  /**
   * Generate supplier analytics report
   * Analyzes supplier performance, response times, and catalog quality
   */
  private async generateSupplierAnalytics(config: ReportConfig): Promise<ReportData> {
    const { startDate, endDate } = this.getDateRange(config.period, config.dateRange);
    
    // Get suppliers (users with SUPPLIER role who have companies)
    const suppliers = await db.user.findMany({
      where: {
        role: 'SUPPLIER',
        isActive: true,
        ...(config.filters?.suppliers?.length && { 
          OR: [
            { id: { in: config.filters.suppliers } },
            { company: { name: { in: config.filters.suppliers } } },
          ]
        }),
      },
      include: {
        company: {
          include: {
            _count: { select: { products: true } },
            products: {
              where: { status: 'published' },
              select: { id: true, viewCount: true },
              take: 100,
            },
          },
        },
        _count: {
          select: {
            quotationsSent: true,
          },
        },
      },
      take: config.limit || 50,
    });
    
    // Get quotation stats per supplier
    const supplierIds = suppliers.map(s => s.id);
    const quotations = await db.quotation.findMany({
      where: {
        supplierId: { in: supplierIds },
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { supplierId: true, id: true, status: true, totalPrice: true, createdAt: true },
    });
    
    // Aggregate supplier performance
    const supplierStats = suppliers.map(supplier => {
      const supplierQuotations = quotations.filter(q => q.supplierId === supplier.id);
      const acceptedQuots = supplierQuotations.filter(q => q.status === 'ACCEPTED');
      const totalQuotationValue = supplierQuotations.reduce((sum, q) => sum + Number(q.totalPrice || 0), 0);
      const avgResponseTime = this.calculateAvgResponseTime(supplierQuotations);
      
      return {
        id: supplier.id,
        name: supplier.company?.name || `${supplier.firstName} ${supplier.lastName}`,
        produits: supplier.company?._count.products || 0,
        vuesTotales: supplier.company?.products.reduce((s, p) => s + p.viewCount, 0) || 0,
        devisEnvoyes: supplierQuotations.length,
        devisAcceptes: acceptedQuots.length,
        tauxAcceptation: supplierQuotations.length > 0 
          ? ((acceptedQuots.length / supplierQuotations.length) * 100).toFixed(1)
          : 'N/A',
        valeurTotale: totalQuotationValue,
        tempsReponseMoyen: avgResponseTime,
      };
    }).sort((a, b) => b.valeurTotale - a.valeurTotale);
    
    return {
      summary: {
        totalFournisseurs: suppliers.length.toString(),
        totalDevis: quotations.length.toString(),
        valeurTotaleDevis: `${quotations.reduce((s, q) => s + Number(q.totalPrice || 0), 0).toFixed(2)} DZD`,
        produitsActifs: suppliers.reduce((s, sup) => s + (sup.company?._count.products || 0), 0).toString(),
      },
      charts: [
        {
          type: 'bar',
          title: 'Top Fournisseurs par Valeur de Devis',
          data: supplierStats.slice(0, 15).map(s => ({
            name: s.name.length > 25 ? s.name.substring(0, 25) + '...' : s.name,
            valeur: s.valeurTotale,
            acceptes: s.devisAcceptes,
          })),
          options: { horizontal: true },
        },
        {
          type: 'radar',
          title: 'Performance des Top 5 Fournisseurs',
          data: supplierStats.slice(0, 5).map(s => ({
            name: s.name.substring(0, 15),
            produits: s.produits,
            devis: s.devisEnvoyes,
            acceptes: s.devisAcceptes,
            vues: Math.round(s.vuesTotales / 100),
          })),
        },
      ],
      table: {
        headers: ['Fournisseur', 'Produits', 'Vues', 'Devis Envoyés', 'Acceptés', 'Taux Accept.', 'Valeur Totale'],
        rows: supplierStats.map(s => [
          s.name,
          s.produits.toString(),
          s.vuesTotales.toString(),
          s.devisEnvoyes.toString(),
          s.devisAcceptes.toString(),
          `${s.tauxAcceptation}%`,
          `${s.valeurTotale.toFixed(2)} DZD`,
        ]),
      },
      insights: this.generateSupplierInsights(supplierStats),
    };
  }

  /**
   * Generate buyer behavior report
   * Analyzes purchasing patterns, preferences, and engagement
   */
  private async generateBuyerBehavior(config: ReportConfig): Promise<ReportData> {
    const { startDate, endDate } = this.getDateRange(config.period, config.dateRange);
    
    // Get buyers with their activity
    const buyers = await db.user.findMany({
      where: {
        role: 'BUYER',
        isActive: true,
        ...(config.filters?.buyers?.length && { 
          OR: [
            { id: { in: config.filters.buyers } },
            { firstName: { in: config.filters.buyers } },
          ]
        }),
      },
      include: {
        _count: {
          select: {
            ordersPlaced: true,
            rfqsCreated: true,
            favorites: true,
            reviews: true,
          },
        },
        ordersPlaced: {
          where: { createdAt: { gte: startDate, lte: endDate } },
          select: { totalAmount: true, createdAt: true, status: true },
          take: 50,
        },
      },
      take: config.limit || 100,
    });
    
    // Analyze buying patterns
    const buyerAnalysis = buyers.map(buyer => {
      const orders = buyer.ordersPlaced;
      const totalSpent = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
      
      // Determine most active time of day
      const hourCounts: Record<number, number> = {};
      orders.forEach(o => {
        const hour = new Date(o.createdAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      
      return {
        id: buyer.id,
        name: `${buyer.firstName} ${buyer.lastName}`,
        wilaya: (buyer as any).wilaya || 'Inconnu',
        commandes: orders.length,
        depensesTotales: totalSpent,
        moyennePanier: avgOrderValue,
        rfqs: buyer._count.rfqsCreated,
        favoris: buyer._count.favorites,
        avis: buyer._count.reviews,
        heurePic: peakHour ? `${peakHour}h` : 'N/A',
      };
    }).sort((a, b) => b.depensesTotales - a.depensesTotales);
    
    // Wilaya distribution of buyers
    const buyersByWilaya = this.countByField(buyers as any[], 'wilaya');
    
    // Spending segments
    const spendingSegments = {
      'Petits acheteurs (<10k DZD)': buyerAnalysis.filter(b => b.depensesTotales < 10000).length,
      'Acheteurs moyens (10k-50k)': buyerAnalysis.filter(b => b.depensesTotales >= 10000 && b.depensesTotales < 50000).length,
      'Gros acheteurs (50k-100k)': buyerAnalysis.filter(b => b.depensesTotales >= 50000 && b.depensesTotales < 100000).length,
      'VIP (>100k DZD)': buyerAnalysis.filter(b => b.depensesTotales >= 100000).length,
    };
    
    return {
      summary: {
        totalAcheteurs: buyers.length.toString(),
        depensesTotales: `${buyerAnalysis.reduce((s, b) => s + b.depensesTotales, 0).toFixed(2)} DZD`,
        panierMoyen: `${(buyerAnalysis.reduce((s, b) => s + b.moyennePanier, 0) / buyerAnalysis.length || 0).toFixed(2)} DZD`,
        rfqTotal: buyerAnalysis.reduce((s, b) => s + b.rfqs, 0).toString(),
      },
      charts: [
        {
          type: 'bar',
          title: 'Top 15 Acheteurs par Dépenses',
          data: buyerAnalysis.slice(0, 15).map(b => ({
            name: b.name,
            depenses: b.depensesTotales,
            commandes: b.commandes,
          })),
          options: { horizontal: true },
        },
        {
          type: 'pie',
          title: 'Segments de Dépense',
          data: Object.entries(spendingSegments).map(([name, value]) => ({ name, value })),
        },
        {
          type: 'funnel',
          title: "Entonnoir d'Engagement Acheteur",
          data: [
            { stage: 'Inscrits', value: buyers.length },
            { stage: 'Avec Favoris', value: buyers.filter(b => b._count.favorites > 0).length },
            { stage: 'RFQ Créés', value: buyers.filter(b => b._count.rfqsCreated > 0).length },
            { stage: 'Commandes', value: buyerAnalysis.filter(b => b.commandes > 0).length },
            { stage: 'Récurrents (>1 cmd)', value: buyerAnalysis.filter(b => b.commandes > 1).length },
          ],
        },
      ],
      table: {
        headers: ['Acheteur', 'Wilaya', 'Commandes', 'Dépenses Totales', 'Panier Moyen', 'RFQs', 'Favoris', 'Heure Pic'],
        rows: buyerAnalysis.map(b => [
          b.name,
          b.wilaya,
          b.commandes.toString(),
          `${b.depensesTotales.toFixed(2)} DZD`,
          `${b.moyennePanier.toFixed(2)} DZD`,
          b.rfqs.toString(),
          b.favoris.toString(),
          b.heurePic,
        ]),
      },
      insights: this.generateBuyerInsights(buyerAnalysis),
    };
  }

  /**
   * Generate RFQ (Request for Quotation) analysis report
   */
  private async generateRFQAnalysis(config: ReportConfig): Promise<ReportData> {
    const { startDate, endDate } = this.getDateRange(config.period, config.dateRange);
    
    const rfqs = await db.rFQ.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...(config.filters?.categories?.length && { categoryId: { in: config.filters.categories } }),
        ...(config.filters?.status?.length && { status: { in: config.filters.status as any[] } }),
      },
      include: {
        buyer: { select: { firstName: true, lastName: true, wilaya: true } },
        category: { select: { name: true } },
        _count: { select: { quotations: true } },
        quotations: {
          select: { id: true, status: true, totalPrice: true, createdAt: true, supplier: { select: { companyName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: config.limit || 200,
    });
    
    // RFQ Statistics
    const totalRFQs = rfqs.length;
    const rfqsWithResponses = rfqs.filter(r => r._count.quotations > 0).length;
    const rfqsWithoutResponses = totalRFQs - rfqsWithResponses;
    const avgQuotesPerRFQ = totalRFQs > 0 ? rfqs.reduce((s, r) => s + r._count.quotations, 0) / totalRFQs : 0;
    
    // Status breakdown
    const statusBreakdown = this.countByField(rfqs, 'status');
    
    // Category breakdown
    const categoryBreakdown = this.countByField(rfqs, 'category.name');
    
    // Response rate by category
    const categoryResponseRate = rfqs.reduce((acc, rfq) => {
      const catName = rfq.category?.name || 'Autre';
      if (!acc[catName]) acc[catName] = { total: 0, withResponses: 0 };
      acc[catName].total++;
      if (rfq._count.quotations > 0) acc[catName].withResponses++;
      return acc;
    }, {} as Record<string, { total: number; withResponses: number }>);
    
    // Daily RFQ trend
    const dailyRFQs = this.groupByDateCount(rfqs, 'createdAt');
    
    return {
      summary: {
        totalRFQs: totalRFQs.toString(),
        avecReponses: rfqsWithResponses.toString(),
        sansReponses: rfqsWithoutResponses.toString(),
        tauxReponse: `${totalRFQs > 0 ? ((rfqsWithResponses / totalRFQs) * 100).toFixed(1) : 0}%`,
        moyDevisParRFQ: avgQuotesPerRFQ.toFixed(1),
      },
      charts: [
        {
          type: 'line',
          title: "Évolution des RFQs Quotidiens",
          data: Object.entries(dailyRFQs).map(([date, count]) => ({ date, count })),
        },
        {
          type: 'pie',
          title: 'RFQs par Catégorie',
          data: categoryBreakdown.map(([name, value]) => ({ name, value })),
        },
        {
          type: 'bar',
          title: 'Taux de Réponse par Catégorie',
          data: Object.entries(categoryResponseRate).map(([cat, stats]) => ({
            name: cat,
            taux: stats.total > 0 ? ((stats.withResponses / stats.total) * 100) : 0,
            total: stats.total,
          })),
        },
      ],
      table: {
        headers: ['Titre', 'Catégorie', 'Acheteur', 'Wilaya', 'Statut', 'Devis Reçus', 'Date'],
        rows: rfqs.map(r => [
          r.title.length > 40 ? r.title.substring(0, 40) + '...' : r.title,
          r.category?.name || '-',
          `${r.buyer.firstName} ${r.buyer.lastName}`,
          r.buyer.wilaya || '-',
          r.status,
          r._count.quotations.toString(),
          r.createdAt.toLocaleDateString('fr-FR'),
        ]),
      },
      insights: this.generateRFQInsights(rfqs, rfqsWithResponses, totalRFQs),
    };
  }

  /**
   * Generate revenue by category report
   */
  private async generateRevenueByCategory(config: ReportConfig): Promise<ReportData> {
    const { startDate, endDate } = this.getDateRange(config.period, config.dateRange);
    
    // Get categories with their products and order data
    const categories = await db.category.findMany({
      where: {
        ...(config.filters?.categories?.length && { id: { in: config.filters.categories } }),
      },
      include: {
        _count: { select: { products: true } },
        products: {
          where: { status: 'published' },
          select: { 
            id: true, 
            name: true, 
            price: true,
            orderItems: {
              where: {
                order: { createdAt: { gte: startDate, lte: endDate } },
              },
              select: { quantity: true, unitPrice: true, totalPrice: true },
            },
          },
          take: 50,
        },
      },
    });
    
    // Calculate revenue per category
    const categoryRevenue = categories.map(cat => {
      let revenue = 0;
      let unitsSold = 0;
      let ordersCount = 0;
      
      cat.products.forEach(product => {
        product.orderItems.forEach(item => {
          revenue += Number(item.totalPrice);
          unitsSold += item.quantity;
          ordersCount++;
        });
      });
      
      return {
        id: cat.id,
        name: cat.name,
        produits: cat._count.products,
        revenu: revenue,
        unitesVendues: unitsSold,
        commandes: ordersCount,
      };
    }).sort((a, b) => b.revenu - a.revenu);
    
    const totalRevenue = categoryRevenue.reduce((s, c) => s + c.revenu, 0);
    
    // Monthly trend per top category
    const topCategories = categoryRevenue.slice(0, 5);
    
    return {
      summary: {
        categoriesAnalysées: categories.length.toString(),
        revenuTotal: `${totalRevenue.toFixed(2)} DZD`,
        unitesVenduesTotales: categoryRevenue.reduce((s, c) => s + c.unitesVendues, 0).toString(),
        categorieTop: categoryRevenue[0]?.name || 'N/A',
      },
      charts: [
        {
          type: 'treemap',
          title: 'Revenus par Catégorie (Treemap)',
          data: categoryRevenue.map(c => ({
            name: c.name,
            value: c.revenu,
            produits: c.produits,
          })),
        },
        {
          type: 'pie',
          title: 'Part de Revenu par Catégorie',
          data: categoryRevenue.slice(0, 10).map(c => ({
            name: c.name,
            value: c.revenu,
            pourcentage: totalRevenue > 0 ? ((c.revenu / totalRevenue) * 100).toFixed(1) : '0',
          })),
        },
        {
          type: 'bar',
          title: 'Top 15 Catégories par Revenu',
          data: categoryRevenue.slice(0, 15).map(c => ({
            name: c.name,
            revenu: c.revenu,
            unites: c.unitesVendues,
          })),
          options: { horizontal: true },
        },
      ],
      table: {
        headers: ['Catégorie', 'Produits Actifs', 'Unités Vendues', 'Revenu', '% du Total', 'Commandes'],
        rows: categoryRevenue.map(c => [
          c.name,
          c.produits.toString(),
          c.unitesVendues.toString(),
          `${c.revenu.toFixed(2)} DZD`,
          totalRevenue > 0 ? `${((c.revenu / totalRevenue) * 100).toFixed(1)}%` : '0%',
          c.commandes.toString(),
        ]),
      },
      insights: this.generateCategoryInsights(categoryRevenue, totalRevenue),
    };
  }

  /**
   * Generate geographic distribution report
   * Shows sales distribution across Algerian wilayas
   */
  private async generateGeographicDistribution(config: ReportConfig): Promise<ReportData> {
    const { startDate, endDate } = this.getDateRange(config.period, config.dateRange);
    
    // Get all orders in the period
    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...(config.filters?.status?.length && { status: { in: config.filters.status as any[] } }),
      },
      include: {
        buyer: { select: { id: true, wilaya: true, city: true } },
      },
    });
    
    // Also get user registrations by wilaya
    const users = await db.user.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        role: { in: ['BUYER', 'SUPPLIER'] },
        ...(config.filters?.wilayas?.length && { wilaya: { in: config.filters.wilayas } }),
      },
      select: { id: true, wilaya: true, role: true, city: true },
    });
    
    // Aggregate orders by wilaya
    const locationData: Record<string, { count: number; revenue: number; buyers: Set<string> }> = {};
    
    orders.forEach(order => {
      const wilaya = order.buyer.wilaya || 'Non spécifié';
      if (!locationData[wilaya]) {
        locationData[wilaya] = { count: 0, revenue: 0, buyers: new Set() };
      }
      locationData[wilaya].count++;
      locationData[wilaya].revenue += Number(order.totalAmount);
      locationData[wilaya].buyers.add(order.buyer.id);
    });
    
    // Aggregate users by wilaya
    const userData: Record<string, { buyers: number; suppliers: number }> = {};
    users.forEach(user => {
      const wilaya = user.wilaya || 'Non spécifié';
      if (!userData[wilaya]) {
        userData[wilaya] = { buyers: 0, suppliers: 0 };
      }
      if (user.role === 'BUYER') userData[wilaya].buyers++;
      else if (user.role === 'SUPPLIER') userData[wilaya].suppliers++;
    });
    
    // Convert to array and sort by revenue
    const locationArray = Object.entries(locationData)
      .map(([wilaya, data]) => ({
        wilaya,
        commandes: data.count,
        revenu: data.revenue,
        acheteursUniques: data.buyers.size,
        nouveauxUtilisateurs: userData[wilaya]?.buyers || 0,
        nouveauxFournisseurs: userData[wilaya]?.suppliers || 0,
      }))
      .sort((a, b) => b.revenu - a.revenu);
    
    const totalRevenue = locationArray.reduce((s, l) => s + l.revenu, 0);
    const totalOrders = locationArray.reduce((s, l) => s + l.commandes, 0);
    
    // Top regions
    const topRegions = locationArray.slice(0, 10);
    
    return {
      summary: {
        regionsActives: locationArray.length.toString(),
        revenuTotal: `${totalRevenue.toFixed(2)} DZD`,
        commandesTotales: totalOrders.toString(),
        regionTop: topRegions[0]?.wilaya || 'N/A',
      },
      charts: [
        {
          type: 'heatmap',
          title: 'Carte Thermique des Ventes par Wilaya',
          data: locationArray.map(l => ({
            region: l.wilaya,
            commandes: l.commandes,
            revenu: l.revenu,
            intensity: totalRevenue > 0 ? l.revenu / totalRevenue : 0,
          })),
          options: {
            colorScale: ['#fff5e6', '#ffcc80', '#ff9800', '#e65100', '#bf360c'],
          },
        },
        {
          type: 'bar',
          title: 'Top 10 Wilayas par Revenu',
          data: topRegions.map(l => ({
            name: l.wilaya,
            revenu: l.revenu,
            commandes: l.commandes,
          })),
          options: { horizontal: true },
        },
      ],
      table: {
        headers: ['Wilaya', 'Commandes', 'Revenu', '% du Total', 'Acheteurs Uniques', 'Nouveaux Users'],
        rows: locationArray.map(l => [
          l.wilaya,
          l.commandes.toString(),
          `${l.revenu.toFixed(2)} DZD`,
          totalRevenue > 0 ? `${((l.revenu / totalRevenue) * 100).toFixed(1)}%` : '0%',
          l.acheteursUniques.toString(),
          (l.nouveauxUtilisateurs + l.nouveauxFournisseurs).toString(),
        ]),
      },
      insights: this.generateGeographicInsights(locationArray, totalRevenue),
    };
  }

  /**
   * Generate payment methods analysis report
   */
  private async generatePaymentMethodsReport(config: ReportConfig): Promise<ReportData> {
    const { startDate, endDate } = this.getDateRange(config.period, config.dateRange);
    
    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...(config.filters?.status?.length && { status: { in: config.filters.status as any[] } }),
        ...(config.filters?.paymentMethod?.length && { paymentMethod: { in: config.filters.paymentMethod } }),
      },
      select: {
        id: true,
        totalAmount: true,
        paymentMethod: true,
        status: true,
        createdAt: true,
        buyer: { select: { wilaya: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: config.limit || 500,
    });
    
    // Payment method breakdown
    const paymentBreakdown: Record<string, { count: number; revenue: number; successful: number }> = {};
    
    orders.forEach(order => {
      const method = order.paymentMethod || 'Inconnu';
      if (!paymentBreakdown[method]) {
        paymentBreakdown[method] = { count: 0, revenue: 0, successful: 0 };
      }
      paymentBreakdown[method].count++;
      paymentBreakdown[method].revenue += Number(order.totalAmount);
      if (order.status === 'DELIVERED') paymentBreakdown[method].successful++;
    });
    
    // Convert to sorted array
    const paymentMethods = Object.entries(paymentBreakdown)
      .map(([method, data]) => ({
        method,
        commandes: data.count,
        revenu: data.revenu,
        reussies: data.successful,
        tauxSucces: data.count > 0 ? ((data.successful / data.count) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.revenu - a.revenu);
    
    const totalRevenue = paymentMethods.reduce((s, p) => s + p.revenu, 0);
    const totalOrders = paymentMethods.reduce((s, p) => s + p.commandes, 0);
    
    // Daily payment trend
    const dailyPayments = this.groupByDateField(orders, 'createdAt', 'totalAmount');
    
    // Payment method by region (for top methods only)
    const paymentByRegion: Record<string, Record<string, number>> = {};
    orders.forEach(order => {
      const method = order.paymentMethod || 'Inconnu';
      const region = order.buyer?.wilaya || 'Inconnu';
      if (!paymentByRegion[method]) paymentByRegion[method] = {};
      paymentByRegion[method][region] = (paymentByRegion[method][region] || 0) + Number(order.totalAmount);
    });
    
    return {
      summary: {
        methodesUtilisees: paymentMethods.length.toString(),
        revenuTotal: `${totalRevenue.toFixed(2)} DZD`,
        commandesTotales: totalOrders.toString(),
        methodePopulaire: paymentMethods[0]?.method || 'N/A',
      },
      charts: [
        {
          type: 'pie',
          title: 'Répartition par Mode de Paiement',
          data: paymentMethods.map(p => ({
            name: this.formatPaymentMethod(p.method),
            value: p.revenu,
            commandes: p.commandes,
          })),
        },
        {
          type: 'bar',
          title: 'Performance des Modes de Paiement',
          data: paymentMethods.map(p => ({
            name: this.formatPaymentMethod(p.method),
            revenu: p.revenu,
            commandes: p.commandes,
            succes: parseFloat(p.tauxSucces),
          })),
        },
        {
          type: 'line',
          title: "Évolution des Paiements Quotidiens",
          data: Object.entries(dailyPayments).map(([date, amount]) => ({
            date,
            montant: Number(amount),
          })),
        },
      ],
      table: {
        headers: ['Mode de Paiement', 'Commandes', 'Revenu', '% du Total', 'Réussies', 'Taux Succès'],
        rows: paymentMethods.map(p => [
          this.formatPaymentMethod(p.method),
          p.commandes.toString(),
          `${p.revenu.toFixed(2)} DZD`,
          totalRevenue > 0 ? `${((p.revenu / totalRevenue) * 100).toFixed(1)}%` : '0%',
          p.reussies.toString(),
          `${p.tauxSucces}%`,
        ]),
      },
      insights: this.generatePaymentInsights(paymentMethods),
    };
  }

  /**
   * Generate user growth report
   */
  private async generateUserGrowthReport(config: ReportConfig): Promise<ReportData> {
    const { startDate, endDate } = this.getDateRange(config.period, config.dateRange);
    
    // Get users registered in the period
    const users = await db.user.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        wilaya: true,
        emailVerified: true,
      },
      orderBy: { createdAt: 'desc' },
      take: config.limit || 1000,
    });
    
    // Role breakdown
    const roleBreakdown = this.countByField(users, 'role');
    
    // Daily registrations
    const dailyRegistrations = this.groupByDateCount(users, 'createdAt');
    
    // Monthly registrations (grouped)
    const monthlyRegistrations = this.groupByMonthCount(users, 'createdAt');
    
    // Verification rate
    const verifiedUsers = users.filter(u => u.emailVerified).length;
    const verificationRate = users.length > 0 ? ((verifiedUsers / users.length) * 100).toFixed(1) : '0';
    
    // Active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = users.filter(u => u.lastLoginAt && u.lastLoginAt >= thirtyDaysAgo).length;
    
    // Wilaya distribution of new users
    const usersByWilaya = this.countByField(users as any[], 'wilaya');
    
    return {
      summary: {
        nouveauxInscrits: users.length.toString(),
        verificationRate: `${verificationRate}%`,
        utilisateursActifs: activeUsers.toString(),
        acheteurs: roleBreakdown.find(r => r[0] === 'BUYER')?.[1]?.toString() || '0',
        fournisseurs: roleBreakdown.find(r => r[0] === 'SUPPLIER')?.[1]?.toString() || '0',
      },
      charts: [
        {
          type: 'line',
          title: "Croissance des Inscriptions Quotidiennes",
          data: Object.entries(dailyRegistrations).map(([date, count]) => ({ date, count })),
        },
        {
          type: 'bar',
          title: "Inscriptions Mensuelles",
          data: Object.entries(monthlyRegistrations).map(([month, count]) => ({ month, count })),
        },
        {
          type: 'pie',
          title: 'Répartition par Rôle',
          data: roleBreakdown.map(([role, count]) => ({
            name: this.formatRole(role),
            value: count,
          })),
        },
        {
          type: 'funnel',
          title: "Entonnoir d'Activation",
          data: [
            { stage: 'Inscrits', value: users.length },
            { stage: 'Email Vérifié', value: verifiedUsers },
            { stage: 'Connexion Récente', value: activeUsers },
            { stage: 'Avec Activité', value: Math.round(activeUsers * 0.7) }, // Estimate
          ],
        },
      ],
      table: {
        headers: ['Email', 'Nom', 'Rôle', 'Wilaya', 'Date Inscription', 'Email Vérifié', 'Dernière Connexion'],
        rows: users.slice(0, 100).map(u => [
          u.email,
          `${u.firstName} ${u.lastName}`,
          this.formatRole(u.role),
          u.wilaya || '-',
          u.createdAt.toLocaleDateString('fr-FR'),
          u.emailVerified ? '✓' : '✗',
          u.lastLoginAt?.toLocaleDateString('fr-FR') || 'Jamais',
        ]),
      },
      insights: this.generateUserGrowthInsights(users, verifiedUsers, activeUsers),
    };
  }

  /**
   * Generate inventory status report
   */
  private async generateInventoryStatusReport(config: ReportConfig): Promise<ReportData> {
    const products = await db.product.findMany({
      where: {
        status: 'published',
        ...(config.filters?.categories?.length && { categoryId: { in: config.filters.categories } }),
      },
      include: {
        category: { select: { name: true } },
        company: { select: { name: true } },
      },
      take: config.limit || 500,
      orderBy: { stockQuantity: 'asc' },
    });
    
    // Inventory status classification
    const outOfStock = products.filter(p => p.stockQuantity <= 0);
    const lowStock = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 10);
    const inStock = products.filter(p => p.stockQuantity > 10 && p.stockQuantity <= 100);
    const wellStocked = products.filter(p => p.stockQuantity > 100);
    
    // Category inventory
    const categoryInventory = products.reduce((acc, p) => {
      const catName = p.category?.name || 'Autre';
      if (!acc[catName]) {
        acc[catName] = { products: 0, totalStock: 0, outOfStock: 0 };
      }
      acc[catName].products++;
      acc[catName].totalStock += p.stockQuantity;
      if (p.stockQuantity <= 0) acc[catName].outOfStock++;
      return acc;
    }, {} as Record<string, { products: number; totalStock: number; outOfStock: number }>);
    
    // Supplier inventory
    const supplierInventory = products.reduce((acc, p) => {
      const supplierName = p.company?.name || 'Inconnu';
      if (!acc[supplierName]) {
        acc[supplierName] = { products: 0, totalStock: 0, lowStock: 0 };
      }
      acc[supplierName].products++;
      acc[supplierName].totalStock += p.stockQuantity;
      if (p.stockQuantity > 0 && p.stockQuantity <= 10) acc[supplierName].lowStock++;
      return acc;
    }, {} as Record<string, { products: number; totalStock: number; lowStock: number }>);
    
    const totalValue = products.reduce((s, p) => s + (p.price * p.stockQuantity), 0);
    
    return {
      summary: {
        totalProduits: products.length.toString(),
        enRupture: outOfStock.length.toString(),
        stockFaible: lowStock.length.toString(),
        enStock: inStock.length.toString(),
        bienApprovisionne: wellStocked.length.toString(),
        valeurTotaleStock: `${totalValue.toFixed(2)} DZD`,
      },
      charts: [
        {
          type: 'pie',
          title: "État des Stocks",
          data: [
            { name: 'En Rupture', value: outOfStock.length, color: '#ef4444' },
            { name: 'Stock Faible (≤10)', value: lowStock.length, color: '#f97316' },
            { name: 'En Stock', value: inStock.length, color: '#3b82f6' },
            { name: 'Bien Approvisionné', value: wellStocked.length, color: '#22c55e' },
          ],
        },
        {
          type: 'bar',
          title: 'Alertes de Stock Faible par Catégorie',
          data: Object.entries(categoryInventory)
            .filter(([, data]) => data.outOfStock > 0 || data.totalStock < 50)
            .map(([cat, data]) => ({
              name: cat,
              produits: data.products,
              rupture: data.outOfStock,
              stockTotal: data.totalStock,
            }))
            .slice(0, 15),
          options: { horizontal: true },
        },
      ],
      table: {
        headers: ['Produit', 'Catégorie', 'Fournisseur', 'Prix Unit.', 'Stock', 'Valeur Stock', 'Statut'],
        rows: products.map(p => [
          p.name,
          p.category?.name || '-',
          p.company?.name || '-',
          `${p.price.toFixed(2)} DZD`,
          p.stockQuantity.toString(),
          `${(p.price * p.stockQuantity).toFixed(2)} DZD`,
          p.stockQuantity <= 0 ? '🔴 Rupture' :
            p.stockQuantity <= 10 ? '🟠 Faible' :
            p.stockQuantity <= 100 ? '🔵 OK' : '🟢 Bon',
        ]),
      },
      insights: this.generateInventoryInsights(outOfStock, lowStock, products),
    };
  }

  /**
   * Generate custom report based on flexible configuration
   */
  private async generateCustomReport(config: ReportConfig): Promise<ReportData> {
    // For custom reports, we combine multiple data sources
    // This is a simplified implementation that can be extended
    
    const { startDate, endDate } = this.getDateRange(config.period, config.dateRange);
    
    // Basic order data
    const orders = await db.order.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      take: config.limit || 200,
    });
    
    // Basic user data
    const users = await db.user.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      take: 100,
    });
    
    return {
      summary: {
        periode: `${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`,
        commandes: orders.length.toString(),
        nouveauxUtilisateurs: users.length.toString(),
        revenuEstime: `${orders.reduce((s, o) => s + Number(o.totalAmount), 0).toFixed(2)} DZD`,
      },
      charts: [],
      table: {
        headers: ['Métrique', 'Valeur'],
        rows: [
          ['Commandes', orders.length.toString()],
          ['Nouveaux Utilisateurs', users.length.toString()],
          ['Revenu Estimé', `${orders.reduce((s, o) => s + Number(o.totalAmount), 0).toFixed(2)} DZD`],
        ],
      },
      insights: [
        'Rapport personnalisé généré avec les données disponibles',
        'Contactez l\'administrateur pour des rapports plus détaillés',
      ],
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get date range from period configuration
   */
  private getDateRange(period: ReportPeriod, customRange?: { start: Date; end: Date }): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    switch (period) {
      case 'today':
        return { 
          startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0), 
          endDate 
        };
      case 'week': {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);
        return { startDate: weekStart, endDate };
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startDate: monthStart, endDate };
      }
      case 'quarter': {
        const quarterStart = new Date(now);
        quarterStart.setMonth(quarterStart.getMonth() - 3);
        return { startDate: quarterStart, endDate };
      }
      case 'year': {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return { startDate: yearStart, endDate };
      }
      case 'custom':
        return { startDate: customRange!.start, endDate: customRange!.end };
      default:
        const defaultStart = new Date(now);
        defaultStart.setMonth(defaultStart.getMonth() - 1);
        return { startDate: defaultStart, endDate };
    }
  }

  /**
   * Group items by date and sum a numeric field
   */
  private groupByDateField<T>(items: T[], dateField: keyof T, valueField: keyof T): Record<string, number> {
    const grouped: Record<string, number> = {};
    items.forEach(item => {
      const date = new Date(item[dateField] as unknown as Date).toLocaleDateString('fr-FR');
      grouped[date] = (grouped[date] || 0) + (Number(item[valueField]) || 0);
    });
    return grouped;
  }

  /**
   * Group items by date and count occurrences
   */
  private groupByDateCount<T>(items: T[], dateField: keyof T): Record<string, number> {
    const grouped: Record<string, number> = {};
    items.forEach(item => {
      const date = new Date(item[dateField] as unknown as Date).toLocaleDateString('fr-FR');
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Group items by month and count occurrences
   */
  private groupByMonthCount<T>(items: T[], dateField: keyof T): Record<string, number> {
    const grouped: Record<string, number> = {};
    items.forEach(item => {
      const date = new Date(item[dateField] as unknown as Date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      grouped[monthKey] = (grouped[monthKey] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Count occurrences of each unique value in a field
   */
  private countByField<T>(items: T[], field: string): Array<[string, number]> {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const value = this.getNestedValue(item, field);
      counts[value] = (counts[value] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }

  /**
   * Aggregate numeric field values grouped by another field
   */
  private aggregateByField<T>(items: T[], groupField: keyof T, aggregateField: keyof T): Array<[string, number]> {
    const aggregated: Record<string, number> = {};
    items.forEach(item => {
      const key = String(item[groupField] || 'Inconnu');
      aggregated[key] = (aggregated[key] || 0) + (Number(item[aggregateField]) || 0);
    });
    return Object.entries(aggregated).sort((a, b) => b[1] - a[1]);
  }

  /**
   * Get nested object value using dot notation path
   */
  private getNestedValue(obj: any, path: string): string {
    return path.split('.').reduce((current, key) => current?.[key], obj)?.toString() || 'Inconnu';
  }

  /**
   * Calculate average response time for quotations
   */
  private calculateAvgResponseTime(quotations: any[]): string {
    if (quotations.length === 0) return 'N/A';
    
    // Simplified calculation - would need created_at vs responded_at comparison
    const avgHours = 24; // Placeholder
    return `${avgHours}h`;
  }

  // ============================================
  // INSIGHT GENERATORS
  // ============================================

  /**
   * Generate insights for sales data
   */
  private generateSalesInsights(orders: any[], totalRevenue: number, avgOrderValue: number): string[] {
    const insights: string[] = [];
    
    if (orders.length > 0) {
      insights.push(`Le chiffre d'affaires total est de ${totalRevenue.toFixed(2)} DZD sur la période`);
      insights.push(`Le panier moyen est de ${avgOrderValue.toFixed(2)} DZD`);
      
      const completedRate = orders.filter(o => o.status === 'DELIVERED').length / orders.length * 100;
      if (completedRate > 70) {
        insights.push(`Excellent taux de complétion des commandes (${completedRate.toFixed(1)}%)`);
      } else if (completedRate < 50) {
        insights.push(`Attention: Le taux de complétion est faible (${completedRate.toFixed(1)}%). Analyse recommandée.`);
      }
      
      // Day of week analysis
      const dayCounts: Record<number, number> = {};
      orders.forEach(o => {
        const day = new Date(o.createdAt).getDay();
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });
      const peakDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
      if (peakDay) {
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        insights.push(`Le jour le plus actif est ${days[parseInt(peakDay[0])]}`);
      }
    }
    
    return insights;
  }

  /**
   * Generate insights for product data
   */
  private generateProductInsights(products: any[], productRevenue: Record<string, number>): string[] {
    const insights: string[] = [];
    
    if (products.length > 0) {
      const topViewed = products[0];
      insights.push(`Le produit le plus vu est "${topViewed.name}" avec ${topViewed.viewCount} vues`);
      
      // Find products with views but no orders
      const viewedNotOrdered = products.filter(p => p.viewCount > 100 && !productRevenue[p.id]);
      if (viewedNotOrdered.length > 5) {
        insights.push(`${viewedNotOrdered.length} produits ont beaucoup de vues mais aucune commande - optimisez leurs fiches`);
      }
      
      // Category concentration
      const categoryConcentration = this.countByField(products, 'category.name');
      if (categoryConcentration.length > 0 && categoryConcentration[0][1] > products.length * 0.4) {
        insights.push(`${categoryConcentration[0][0]} représente plus de 40% du catalogue - envisagez la diversification`);
      }
    }
    
    return insights;
  }

  /**
   * Generate insights for supplier data
   */
  private generateSupplierInsights(supplierStats: any[]): string[] {
    const insights: string[] = [];
    
    if (supplierStats.length > 0) {
      const topSupplier = supplierStats[0];
      insights.push(`Le fournisseur leader est "${topSupplier.name}" avec ${topSupplier.devisAcceptes} devis acceptés`);
      
      // Average acceptance rate
      const avgAcceptance = supplierStats.reduce((s, sup) => s + parseFloat(sup.tauxAcceptation || '0'), 0) / supplierStats.length;
      insights.push(`Le taux d'acceptation moyen des devis est de ${avgAcceptance.toFixed(1)}%`);
      
      // Identify inactive suppliers
      const inactiveSuppliers = supplierStats.filter(s => s.devisEnvoyes === 0);
      if (inactiveSuppliers.length > 0) {
        insights.push(`${inactiveSuppliers.length} fournisseurs n'ont envoyé aucun devis sur la période`);
      }
    }
    
    return insights;
  }

  /**
   * Generate insights for buyer behavior
   */
  private generateBuyerInsights(buyerAnalysis: any[]): string[] {
    const insights: string[] = [];
    
    if (buyerAnalysis.length > 0) {
      const topBuyer = buyerAnalysis[0];
      insights.push(`Le meilleur acheteur est "${topBuyer.name}" avec ${topBuyer.depensesTotales.toFixed(2)} DZD de dépenses`);
      
      // Repeat purchase rate
      const repeatBuyers = buyerAnalysis.filter(b => b.commandes > 1).length;
      const repeatRate = (repeatBuyers / buyerAnalysis.length) * 100;
      insights.push(`Taux de rachat: ${repeatRate.toFixed(1)}% des acheteurs ont effectué plusieurs commandes`);
      
      // Average basket analysis
      const highBasketBuyers = buyerAnalysis.filter(b => b.moyennePanier > 50000);
      if (highBasketBuyers.length > 0) {
        insights.push(`${highBasketBuyers.length} acheteurs ont un panier moyen supérieur à 50 000 DZD - segment VIP potentiel`);
      }
    }
    
    return insights;
  }

  /**
   * Generate insights for RFQ data
   */
  private generateRFQInsights(rfqs: any[], withResponses: number, total: number): string[] {
    const insights: string[] = [];
    
    if (total > 0) {
      const responseRate = (withResponses / total) * 100;
      insights.push(`Taux de réponse aux RFQ: ${responseRate.toFixed(1)}%`);
      
      if (responseRate < 50) {
        insights.push('Attention: Moins de la moitié des RFQs reçoivent des réponses - encouragez les fournisseurs');
      }
      
      // Average time to first response (simplified)
      insights.push('Considérez un système de notification push pour alerter les fournisseurs des nouveaux RFQs');
    }
    
    return insights;
  }

  /**
   * Generate insights for category revenue
   */
  private generateCategoryInsights(categoryRevenue: any[], totalRevenue: number): string[] {
    const insights: string[] = [];
    
    if (categoryRevenue.length > 0) {
      const topCategory = categoryRevenue[0];
      const topPercentage = (topCategory.revenu / totalRevenue) * 100;
      insights.push(`"${topCategory.name}" domine avec ${topPercentage.toFixed(1)}% du revenu total`);
      
      // Underperforming categories
      const underperforming = categoryRevenue.filter(c => c.revenu < totalRevenue * 0.01);
      if (underperforming.length > 3) {
        insights.push(`${underperforming.length} catégories représentent moins de 1% du revenu chacune - évaluez leur pertinence`);
      }
    }
    
    return insights;
  }

  /**
   * Generate insights for geographic data
   */
  private generateGeographicInsights(locationArray: any[], totalRevenue: number): string[] {
    const insights: string[] = [];
    
    if (locationArray.length > 0) {
      const topRegion = locationArray[0];
      const topConcentration = (topRegion.revenu / totalRevenue) * 100;
      insights.push(`${topRegion.wilaya} concentre ${topConcentration.toFixed(1)}% des ventes`);
      
      // Coverage analysis
      const coveredWilayas = locationArray.filter(l => l.commandes > 0).length;
      insights.push(`${coveredWilayas} wilayas sont actives commercialement sur 58 au total`);
      
      // Growth opportunities
      const untappedRegions = locationArray.filter(l => l.commandes < 5);
      if (untappedRegions.length > 10) {
        insights.push(`${untappedRegions.length} régions ont moins de 5 commandes - opportunités de développement`);
      }
    }
    
    return insights;
  }

  /**
   * Generate insights for payment methods
   */
  private generatePaymentInsights(paymentMethods: any[]): string[] {
    const insights: string[] = [];
    
    if (paymentMethods.length > 0) {
      const popular = paymentMethods[0];
      insights.push(`Le mode de paiement préféré est "${this.formatPaymentMethod(popular.method)}"`);
      
      // Check CIB/BaridiMob adoption
      const electronicPayments = paymentMethods.filter(p => 
        ['CIB', 'BARIDIMOB', 'CCP'].includes(p.method)
      );
      if (electronicPayments.length > 0) {
        insights.push('Les paiements électroniques sont bien adoptés - continuez à promouvoir cette option');
      }
    }
    
    return insights;
  }

  /**
   * Generate insights for user growth
   */
  private generateUserGrowthInsights(users: any[], verified: number, active: number): string[] {
    const insights: string[] = [];
    
    if (users.length > 0) {
      const verificationRate = (verified / users.length) * 100;
      insights.push(`Taux de vérification email: ${verificationRate.toFixed(1)}%`);
      
      if (verificationRate < 70) {
        insights.push('Améliorez le processus de vérification email pour augmenter l\'engagement');
      }
      
      const activationRate = (active / users.length) * 100;
      insights.push(`Taux d\'activation (connexion récente): ${activationRate.toFixed(1)}%`);
    }
    
    return insights;
  }

  /**
   * Generate insights for inventory
   */
  private generateInventoryInsights(outOfStock: any[], lowStock: any[], allProducts: any[]): string[] {
    const insights: string[] = [];
    
    if (allProducts.length > 0) {
      const stockIssueRate = ((outOfStock.length + lowStock.length) / allProducts.length) * 100;
      insights.push(`${outOfStock.length} produits sont en rupture de stock`);
      insights.push(`${lowStock.length} produits ont un stock faible (≤10 unités)`);
      
      if (stockIssueRate > 20) {
        insights.push(`⚠️ Attention: ${stockIssueRate.toFixed(1)}% des produits ont des problèmes de stock`);
      }
      
      // High value items at risk
      const highValueAtRisk = outOfStock.filter(p => p.price > 10000);
      if (highValueAtRisk.length > 0) {
        insights.push(`${highValueAtRisk.length} produits à haute valeur (>10k DZD) sont en rupture - priorité de réapprovisionnement`);
      }
    }
    
    return insights;
  }

  // ============================================
  // FORMATTERS
  // ============================================

  /**
   * Format payment method code to display name
   */
  private formatPaymentMethod(method: string): string {
    const methods: Record<string, string> = {
      'CIB': 'Carte CIB',
      'BARIDIMOB': 'BaridiMob',
      'CCP': 'Compte CCP',
      'BANK_TRANSFER': 'Virement Bancaire',
      'COD': 'Paiement à la Livraison',
    };
    return methods[method] || method;
  }

  /**
   * Format user role to French display name
   */
  private formatRole(role: string): string {
    const roles: Record<string, string> = {
      'SUPER_ADMIN': 'Super Admin',
      'ADMIN': 'Administrateur',
      'MODERATOR': 'Modérateur',
      'BUYER': 'Acheteur',
      'SUPPLIER': 'Fournisseur',
    };
    return roles[role] || role;
  }

  /**
   * Return empty report structure for failed generations
   */
  private emptyReport(): ReportData {
    return {
      summary: {},
      charts: [],
      table: { headers: [], rows: [] },
      insights: ['Aucune donnée disponible pour cette période ou configuration'],
    };
  }
}

// Export singleton instance
export const reportGenerator = new ReportGenerator();
