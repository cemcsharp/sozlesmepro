import React from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Document {
    id: string;
    originalName: string;
    fileSize: number;
}

interface Contract {
    contractNumber: string;
    subject: string;
    description: string;
    startDate: string;
    endDate: string;
    amount: number;
    currency: string | { code: string };
    paymentFrequency: string | { name: string };
    status: string;
    department: string;
    company: { name: string; address?: string; phone?: string };
    category?: { name: string };
    type?: { name: string };
    companyRepresentative?: string;
    internalResponsible?: string;
    counterpartyName?: string;
    counterpartyContact?: string;
    counterpartyEmail?: string;
    counterpartyPhone?: string;
    documents: Document[];
}

export const ContractPrintTemplate: React.FC<{ contract: Contract }> = ({ contract }) => {
    const getCurrency = (curr: any) => typeof curr === 'string' ? curr : curr.code || 'TRY';
    const getFreq = (freq: any) => {
        if (!freq) return '---';
        const val = typeof freq === 'string' ? freq : freq.name || '---';
        switch (val) {
            case 'ONE_TIME': return 'Tek Seferlik';
            case 'ANNUAL': return 'Yıllık';
            case 'QUARTERLY': return 'Üç Aylık';
            case 'MONTHLY': return 'Aylık';
            default: return val;
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'dd MMMM yyyy', { locale: tr });
        } catch {
            return '---';
        }
    };

    return (
        <div
            id="contract-pdf-template"
            style={{
                width: '210mm',
                padding: '20mm',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                fontFamily: 'Arial, sans-serif',
                lineHeight: '1.5'
            }}
        >
            {/* Header */}
            <div style={{ borderBottom: '2px solid #3b82f6', paddingBottom: '10px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>SÖZLEŞME BİLGİ FORMU</h1>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Referans No: <strong>{contract.contractNumber}</strong></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>{contract.company.name}</p>
                    <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>{format(new Date(), 'dd.MM.yyyy')}</p>
                </div>
            </div>

            {/* Subject & Amount */}
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>{contract.subject}</h2>
                <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Sözleşme Tutarı</p>
                        <p style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#059669' }}>
                            {contract.amount.toLocaleString('tr-TR')} {getCurrency(contract.currency)}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Ödeme Periyodu</p>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{getFreq(contract.paymentFrequency)}</p>
                    </div>
                </div>
            </div>

            {/* Grid Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                {/* Dates */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: '#3b82f6', borderBottom: '1px solid #f1f5f9', paddingBottom: '5px' }}>TARİH BİLGİLERİ</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Başlangıç:</span>
                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{formatDate(contract.startDate)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Bitiş (Vade):</span>
                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{formatDate(contract.endDate)}</span>
                    </div>
                </div>

                {/* Classification */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: '#3b82f6', borderBottom: '1px solid #f1f5f9', paddingBottom: '5px' }}>SINIFLANDIRMA</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Kategori:</span>
                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{contract.category?.name || '---'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Alt Tip:</span>
                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{contract.type?.name || '---'}</span>
                    </div>
                </div>
            </div>

            {/* Parties */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: '#3b82f6', borderBottom: '1px solid #f1f5f9', paddingBottom: '5px' }}>TARAF BİLGİLERİ</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>KARŞI FİRMA</p>
                        <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold' }}>{contract.counterpartyName || '---'}</p>
                        <p style={{ margin: '0', fontSize: '11px', color: '#475569' }}>Yetkili: {contract.counterpartyContact || '---'}</p>
                        <p style={{ margin: '0', fontSize: '11px', color: '#475569' }}>E-Posta: {contract.counterpartyEmail || '---'}</p>
                        {contract.counterpartyPhone && (
                            <p style={{ margin: '0', fontSize: '11px', color: '#475569' }}>Tel: {contract.counterpartyPhone}</p>
                        )}
                    </div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>İÇ SORUMLULAR</p>
                        <p style={{ margin: '0 0 2px 0', fontSize: '11px' }}><span style={{ color: '#64748b' }}>Sorumlu:</span> <strong>{contract.internalResponsible || '---'}</strong></p>
                        <p style={{ margin: '0', fontSize: '11px' }}><span style={{ color: '#64748b' }}>Birim:</span> <strong>{contract.department}</strong></p>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: '#3b82f6', borderBottom: '1px solid #f1f5f9', paddingBottom: '5px' }}>AÇIKLAMA</h3>
                <p style={{ fontSize: '12px', color: '#475569', textAlign: 'justify' }}>
                    {contract.description || 'Bu sözleşme için herhangi bir açıklama girilmemiş.'}
                </p>
            </div>

            {/* Documents */}
            {contract.documents.length > 0 && (
                <div>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: '#3b82f6', borderBottom: '1px solid #f1f5f9', paddingBottom: '5px' }}>EK BELGELER</h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '11px', color: '#475569' }}>
                        {contract.documents.map(doc => (
                            <li key={doc.id} style={{ marginBottom: '5px' }}>
                                {doc.originalName} ({Math.round(doc.fileSize / 1024)} KB)
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: '50px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '9px', color: '#94a3b8' }}>Bu belge SozlesmePRO tarafından otomatik olarak oluşturulmuştur.</p>
            </div>
        </div>
    );
};
