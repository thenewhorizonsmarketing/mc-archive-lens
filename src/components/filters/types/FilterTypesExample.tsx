import React, { useState } from 'react';
import { TextFilter, DateFilter, RangeFilter, BooleanFilter } from './index';
import type { TextFilterConfig, DateFilterConfig, RangeFilterConfig, BooleanFilterConfig } from './index';
import '../../../styles/advanced-filter.css';

/**
 * FilterTypesExample Component
 * 
 * Demonstrates all advanced filter types with MC Law blue styling:
 * - Text Filter: Search with match types and case sensitivity
 * - Date Filter: Calendar picker with presets
 * - Range Filter: Dual slider with gold handles
 * - Boolean Filter: Toggle switch with smooth animations
 */
export const FilterTypesExample: React.FC = () => {
  const [textConfig, setTextConfig] = useState<TextFilterConfig | null>(null);
  const [dateConfig, setDateConfig] = useState<DateFilterConfig | null>(null);
  const [rangeConfig, setRangeConfig] = useState<RangeFilterConfig | null>(null);
  const [booleanConfig, setBooleanConfig] = useState<BooleanFilterConfig | null>(null);

  return (
    <div style={{ 
      padding: '24px', 
      background: '#0C2340',
      minHeight: '100vh',
      color: '#FFFFFF'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 600, 
          marginBottom: '32px',
          color: '#C99700'
        }}>
          Advanced Filter Types
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Text Filter Example */}
          <section>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 500, 
              marginBottom: '16px',
              color: '#FFFFFF'
            }}>
              Text Filter
            </h2>
            <TextFilter
              field="name"
              label="Search by Name"
              placeholder="Enter name..."
              onChange={setTextConfig}
            />
            {textConfig && (
              <div style={{ 
                marginTop: '12px', 
                padding: '12px', 
                background: 'rgba(201, 151, 0, 0.2)',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}>
                <strong>Current Config:</strong>
                <pre style={{ margin: '8px 0 0 0', fontSize: '0.8125rem' }}>
                  {JSON.stringify(textConfig, null, 2)}
                </pre>
              </div>
            )}
          </section>

          {/* Date Filter Example */}
          <section>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 500, 
              marginBottom: '16px',
              color: '#FFFFFF'
            }}>
              Date Filter
            </h2>
            <DateFilter
              field="graduationDate"
              label="Graduation Date"
              onChange={setDateConfig}
            />
            {dateConfig && (
              <div style={{ 
                marginTop: '12px', 
                padding: '12px', 
                background: 'rgba(201, 151, 0, 0.2)',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}>
                <strong>Current Config:</strong>
                <pre style={{ margin: '8px 0 0 0', fontSize: '0.8125rem' }}>
                  {JSON.stringify({
                    ...dateConfig,
                    startDate: dateConfig.startDate?.toISOString(),
                    endDate: dateConfig.endDate?.toISOString(),
                  }, null, 2)}
                </pre>
              </div>
            )}
          </section>

          {/* Range Filter Example */}
          <section>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 500, 
              marginBottom: '16px',
              color: '#FFFFFF'
            }}>
              Range Filter
            </h2>
            <RangeFilter
              field="year"
              label="Graduation Year"
              min={1980}
              max={2025}
              currentMin={1990}
              currentMax={2020}
              step={1}
              onChange={setRangeConfig}
            />
            {rangeConfig && (
              <div style={{ 
                marginTop: '12px', 
                padding: '12px', 
                background: 'rgba(201, 151, 0, 0.2)',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}>
                <strong>Current Config:</strong>
                <pre style={{ margin: '8px 0 0 0', fontSize: '0.8125rem' }}>
                  {JSON.stringify(rangeConfig, null, 2)}
                </pre>
              </div>
            )}
          </section>

          {/* Boolean Filter Example */}
          <section>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 500, 
              marginBottom: '16px',
              color: '#FFFFFF'
            }}>
              Boolean Filter
            </h2>
            <BooleanFilter
              field="hasPhoto"
              label="Has Photo"
              description="Filter alumni records that include a photo"
              onLabel="With Photo"
              offLabel="No Photo"
              onChange={setBooleanConfig}
            />
            {booleanConfig && (
              <div style={{ 
                marginTop: '12px', 
                padding: '12px', 
                background: 'rgba(201, 151, 0, 0.2)',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}>
                <strong>Current Config:</strong>
                <pre style={{ margin: '8px 0 0 0', fontSize: '0.8125rem' }}>
                  {JSON.stringify(booleanConfig, null, 2)}
                </pre>
              </div>
            )}
          </section>

          {/* Combined Filters Summary */}
          <section style={{ 
            marginTop: '24px', 
            padding: '20px', 
            background: 'rgba(12, 35, 64, 0.8)',
            border: '2px solid #C99700',
            borderRadius: '12px'
          }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 500, 
              marginBottom: '16px',
              color: '#C99700'
            }}>
              All Active Filters
            </h2>
            <div style={{ fontSize: '0.875rem' }}>
              {!textConfig && !dateConfig && !rangeConfig && !booleanConfig ? (
                <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  No filters applied yet. Try adjusting the filters above.
                </p>
              ) : (
                <pre style={{ 
                  margin: 0, 
                  fontSize: '0.8125rem',
                  lineHeight: 1.6,
                  color: '#FFFFFF'
                }}>
                  {JSON.stringify({
                    text: textConfig,
                    date: dateConfig ? {
                      ...dateConfig,
                      startDate: dateConfig.startDate?.toISOString(),
                      endDate: dateConfig.endDate?.toISOString(),
                    } : null,
                    range: rangeConfig,
                    boolean: booleanConfig,
                  }, null, 2)}
                </pre>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default FilterTypesExample;
