'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  HelpCircle, 
  Plus, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import type { StandardJSONSchema, ValidationResult } from '@/types/workflows';

interface UniversalFormRendererProps {
  schema: StandardJSONSchema;
  formData: Record<string, any>;
  onFormDataChange: (formData: Record<string, any>) => void;
  onValidationChange?: (validation: ValidationResult) => void;
  disabled?: boolean;
  className?: string;
}

interface FieldProps {
  name: string;
  schema: StandardJSONSchema;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  path: string[];
}

export function UniversalFormRenderer({
  schema,
  formData,
  onFormDataChange,
  onValidationChange,
  disabled = false,
  className = ''
}: UniversalFormRendererProps) {
  const [validation, setValidation] = useState<ValidationResult>({ valid: true, errors: [] });

  // Validate form data whenever it changes
  useEffect(() => {
    const validateData = (data: any, schema: StandardJSONSchema, path: string = ''): ValidationResult => {
      const errors: any[] = [];
      
      // Basic type validation
      if (schema.type && data !== undefined && data !== null) {
        const actualType = Array.isArray(data) ? 'array' : typeof data;
        if (schema.type !== actualType) {
          errors.push({
            field: path || 'root',
            message: `Expected ${schema.type}, got ${actualType}`,
            code: 'TYPE_MISMATCH',
            value: data
          });
        }
      }
      
      // Required field validation
      if (schema.required && schema.type === 'object') {
        for (const requiredField of schema.required) {
          if (!data || !(requiredField in data) || data[requiredField] === undefined || data[requiredField] === '') {
            errors.push({
              field: path ? `${path}.${requiredField}` : requiredField,
              message: `${requiredField} is required`,
              code: 'REQUIRED_FIELD_MISSING'
            });
          }
        }
      }
      
      // Property validation for objects
      if (schema.type === 'object' && schema.properties && data && typeof data === 'object') {
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          const propPath = path ? `${path}.${propName}` : propName;
          const propValue = data[propName];
          
          if (propValue !== undefined) {
            const propValidation = validateData(propValue, propSchema as StandardJSONSchema, propPath);
            errors.push(...propValidation.errors);
          }
        }
      }
      
      // String validations
      if (schema.type === 'string' && typeof data === 'string') {
        if (schema.minLength && data.length < schema.minLength) {
          errors.push({
            field: path || 'root',
            message: `Must be at least ${schema.minLength} characters`,
            code: 'MIN_LENGTH_VIOLATION',
            value: data
          });
        }
        
        if (schema.maxLength && data.length > schema.maxLength) {
          errors.push({
            field: path || 'root',
            message: `Must be at most ${schema.maxLength} characters`,
            code: 'MAX_LENGTH_VIOLATION',
            value: data
          });
        }
        
        if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
          errors.push({
            field: path || 'root',
            message: `Does not match required pattern`,
            code: 'PATTERN_VIOLATION',
            value: data
          });
        }
        
        if (schema.enum && !schema.enum.includes(data)) {
          errors.push({
            field: path || 'root',
            message: `Must be one of: ${schema.enum.join(', ')}`,
            code: 'ENUM_VIOLATION',
            value: data
          });
        }
      }
      
      // Number validations
      if ((schema.type === 'number' || schema.type === 'integer') && typeof data === 'number') {
        if (schema.minimum !== undefined && data < schema.minimum) {
          errors.push({
            field: path || 'root',
            message: `Must be at least ${schema.minimum}`,
            code: 'MINIMUM_VIOLATION',
            value: data
          });
        }
        
        if (schema.maximum !== undefined && data > schema.maximum) {
          errors.push({
            field: path || 'root',
            message: `Must be at most ${schema.maximum}`,
            code: 'MAXIMUM_VIOLATION',
            value: data
          });
        }
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    };

    const result = validateData(formData, schema);
    setValidation(result);
    onValidationChange?.(result);
  }, [formData, schema, onValidationChange]);

  const handleFieldChange = useCallback((path: string[], value: any) => {
    const newFormData = { ...formData };
    let current = newFormData;
    
    // Navigate to the parent object
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    
    // Set the value
    current[path[path.length - 1]] = value;
    
    onFormDataChange(newFormData);
  }, [formData, onFormDataChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      <FormField
        name="root"
        schema={schema}
        value={formData}
        onChange={(value) => onFormDataChange(value || {})}
        disabled={disabled}
        path={[]}
      />
      
      {/* Validation Summary */}
      {!validation.valid && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Validation Errors:</strong>
            <ul className="list-disc list-inside mt-2">
              {validation.errors.map((error, idx) => (
                <li key={idx} className="text-sm">
                  <strong>{error.field}:</strong> {error.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function FormField({ name, schema, value, onChange, disabled, path }: FieldProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const fieldPath = [...path, name].filter(p => p !== 'root');
  const fieldId = fieldPath.join('.');
  const isRequired = path.length > 0 && 
    typeof schema.required === 'object' && 
    Array.isArray(schema.required) && 
    schema.required.includes(name);

  // Handle different schema types
  if (schema.type === 'object') {
    return (
      <Card className="w-full">
        <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {schema.title || name}
                    {isRequired && <Badge variant="destructive" className="text-xs">Required</Badge>}
                    {schema.uiHints?.help && (
                      <HelpCircle className="h-4 w-4 text-muted-foreground" title={schema.uiHints.help} />
                    )}
                  </CardTitle>
                  {schema.description && (
                    <CardDescription>{schema.description}</CardDescription>
                  )}
                </div>
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {schema.properties && Object.entries(schema.properties).map(([propName, propSchema]) => (
                <FormField
                  key={propName}
                  name={propName}
                  schema={propSchema as StandardJSONSchema}
                  value={value?.[propName]}
                  onChange={(propValue) => {
                    const newValue = { ...value };
                    if (propValue === undefined) {
                      delete newValue[propName];
                    } else {
                      newValue[propName] = propValue;
                    }
                    onChange(newValue);
                  }}
                  disabled={disabled}
                  path={fieldPath}
                />
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  if (schema.type === 'array') {
    const arrayValue = Array.isArray(value) ? value : [];
    
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId} className="flex items-center gap-2">
          {schema.title || name}
          {isRequired && <Badge variant="destructive" className="text-xs">Required</Badge>}
          {schema.uiHints?.help && (
            <HelpCircle className="h-4 w-4 text-muted-foreground" title={schema.uiHints.help} />
          )}
        </Label>
        {schema.description && (
          <p className="text-sm text-muted-foreground">{schema.description}</p>
        )}
        
        <div className="space-y-2">
          {arrayValue.map((item, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1">
                {schema.items && (
                  <FormField
                    name={`${index}`}
                    schema={schema.items as StandardJSONSchema}
                    value={item}
                    onChange={(itemValue) => {
                      const newArray = [...arrayValue];
                      newArray[index] = itemValue;
                      onChange(newArray);
                    }}
                    disabled={disabled}
                    path={[...fieldPath, index.toString()]}
                  />
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newArray = arrayValue.filter((_, i) => i !== index);
                  onChange(newArray);
                }}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const defaultValue = schema.items?.default ?? 
                (schema.items?.type === 'string' ? '' :
                 schema.items?.type === 'number' ? 0 :
                 schema.items?.type === 'boolean' ? false :
                 schema.items?.type === 'object' ? {} :
                 schema.items?.type === 'array' ? [] : null);
              onChange([...arrayValue, defaultValue]);
            }}
            disabled={disabled}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>
    );
  }

  // Primitive types
  const inputId = fieldId || name;
  
  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="flex items-center gap-2">
        {schema.title || name}
        {isRequired && <Badge variant="destructive" className="text-xs">Required</Badge>}
        {schema.uiHints?.help && (
          <HelpCircle className="h-4 w-4 text-muted-foreground" title={schema.uiHints.help} />
        )}
      </Label>
      {schema.description && (
        <p className="text-sm text-muted-foreground">{schema.description}</p>
      )}
      
      {renderPrimitiveField(schema, value, onChange, disabled, inputId)}
    </div>
  );
}

function renderPrimitiveField(
  schema: StandardJSONSchema,
  value: any,
  onChange: (value: any) => void,
  disabled: boolean,
  inputId: string
) {
  const placeholder = schema.uiHints?.placeholder || 
    (schema.examples?.[0] ? String(schema.examples[0]) : undefined);

  // Enum/Select fields
  if (schema.enum) {
    return (
      <Select 
        value={value || ''} 
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id={inputId}>
          <SelectValue placeholder={placeholder || 'Select an option...'} />
        </SelectTrigger>
        <SelectContent>
          {schema.enum.map((option) => (
            <SelectItem key={String(option)} value={String(option)}>
              {String(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Boolean fields
  if (schema.type === 'boolean') {
    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          id={inputId}
          checked={value || false}
          onCheckedChange={onChange}
          disabled={disabled}
        />
        <Label htmlFor={inputId} className="text-sm font-normal">
          {schema.title || 'Enable this option'}
        </Label>
      </div>
    );
  }

  // Number fields
  if (schema.type === 'number' || schema.type === 'integer') {
    return (
      <Input
        id={inputId}
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '') {
            onChange(undefined);
          } else {
            const num = schema.type === 'integer' ? parseInt(val) : parseFloat(val);
            onChange(isNaN(num) ? undefined : num);
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        min={schema.minimum}
        max={schema.maximum}
        step={schema.type === 'integer' ? 1 : 'any'}
      />
    );
  }

  // String fields
  if (schema.type === 'string') {
    // Determine widget type
    const widget = schema.uiHints?.widget;
    
    if (widget === 'textarea') {
      return (
        <Textarea
          id={inputId}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
        />
      );
    }
    
    // Default to input with appropriate type
    let inputType = 'text';
    if (widget === 'password') inputType = 'password';
    else if (widget === 'email' || schema.format === 'email') inputType = 'email';
    else if (widget === 'url' || schema.format === 'uri') inputType = 'url';
    else if (widget === 'date' || schema.format === 'date') inputType = 'date';
    else if (widget === 'time' || schema.format === 'time') inputType = 'time';
    else if (widget === 'datetime-local' || schema.format === 'date-time') inputType = 'datetime-local';
    
    return (
      <Input
        id={inputId}
        type={inputType}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        minLength={schema.minLength}
        maxLength={schema.maxLength}
        pattern={schema.pattern}
      />
    );
  }

  // Fallback for unknown types
  return (
    <Input
      id={inputId}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}