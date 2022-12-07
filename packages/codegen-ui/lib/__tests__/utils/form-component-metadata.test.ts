/*
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

  Licensed under the Apache License, Version 2.0 (the "License").
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 */
import { generateFormDefinition } from '../../generate-form-definition';
import { getGenericFromDataStore } from '../../generic-from-datastore';
import { FormDefinition, StudioForm } from '../../types';
import { mapFormMetadata, generateUniqueFieldName, isValidVariableName } from '../../utils/form-component-metadata';
import { getBasicFormDefinition } from '../__utils__/basic-form-definition';
import { schemaWithCPK, schemaWithRelationships } from '../__utils__/mock-schemas';

describe('mapFormMetaData', () => {
  it('should not map metadata for sectional elements', () => {
    const formDefinition: FormDefinition = {
      ...getBasicFormDefinition(),
      elements: {
        myHeading: { componentType: 'Heading', props: { level: 2, children: 'Create a Post' } },
        name: { componentType: 'TextField', props: { label: 'Label' }, studioFormComponentType: 'TextField' },
        myText: { componentType: 'Text', props: { children: 'Did you put your name above?' } },
        myDivider: { componentType: 'Divider', props: { orientation: 'horizontal' } },
      },
      elementMatrix: [['myHeading'], ['name'], ['myText'], ['myDivider']],
    };

    const form: StudioForm = {
      name: 'CustomWithSectionalElements',
      formActionType: 'create',
      dataType: {
        dataSourceType: 'Custom',
        dataTypeName: 'Post',
      },
      fields: {
        name: {
          inputType: {
            type: 'TextField',
          },
        },
      },
      sectionalElements: {
        myHeading: {
          position: {
            fixed: 'first',
          },
          type: 'Heading',
          level: 2,
          text: 'Create a Post',
        },
        myText: {
          position: {
            below: 'name',
          },
          type: 'Text',
          text: 'Did you put your name above?',
        },
        myDivider: {
          position: {
            below: 'myText',
          },
          type: 'Divider',
        },
      },
      style: {},
      cta: {},
    };

    const { fieldConfigs } = mapFormMetadata(form, formDefinition);

    expect('name' in fieldConfigs).toBe(true);
    expect('myDivider' in fieldConfigs || 'myText' in fieldConfigs || 'myHeading' in fieldConfigs).toBe(false);
  });
  it('should map isArray type for autogenerated datastore form', () => {
    const dataSchema = getGenericFromDataStore(schemaWithRelationships);

    const form: StudioForm = {
      name: 'DataStoreForm',
      formActionType: 'create',
      dataType: {
        dataSourceType: 'DataStore',
        dataTypeName: 'Student',
      },
      fields: {},
      sectionalElements: {},
      style: {},
      cta: {},
    };

    const { fieldConfigs } = mapFormMetadata(form, generateFormDefinition({ form, dataSchema }));

    expect('Teachers' in fieldConfigs).toBe(true);
    expect(fieldConfigs.Teachers.isArray).toBe(true);
  });

  it('should map relationship if it exists', () => {
    const dataSchema = getGenericFromDataStore(schemaWithCPK);

    const form: StudioForm = {
      name: 'DataStoreForm',
      formActionType: 'create',
      dataType: {
        dataSourceType: 'DataStore',
        dataTypeName: 'Teacher',
      },
      fields: {},
      sectionalElements: {},
      style: {},
      cta: {},
    };

    const { fieldConfigs } = mapFormMetadata(form, generateFormDefinition({ form, dataSchema }));

    expect('Student' in fieldConfigs).toBe(true);
    expect(fieldConfigs.Student.relationship).toStrictEqual({
      type: 'HAS_ONE',
      relatedModelName: 'Student',
      associatedField: 'TeacherStudentId',
    });
  });

  describe('generateUniqueFieldName tests', () => {
    let usedFieldNames: Set<string>;
    beforeEach(() => {
      usedFieldNames = new Set();
    });
    it('should not add sanitizedFieldName if name is unique and valid', () => {
      const sanitizedFieldName = generateUniqueFieldName('test_FieldName', usedFieldNames);
      expect(sanitizedFieldName).toBeFalsy();
      expect(usedFieldNames.has('test_FieldName'.toLowerCase())).toBeTruthy();
    });
    it('should add sanitizedFieldName if name is invalid', () => {
      const sanitizedFieldName = generateUniqueFieldName('test-Field-Name', usedFieldNames);
      expect(sanitizedFieldName).toEqual('testFieldName');
      expect(usedFieldNames.has('testFieldName'.toLowerCase())).toBeTruthy();
    });
    it('should add sanitizedFieldName with count modifier if sanitized name is used already', () => {
      const mappedFieldNames = [
        'test-Field-Name',
        'test-Field-Name0',
        '1testField name1',
        '1testField name2',
        '1testField name3',
        '1testField name4',
        '1testField name5',
        '1testField name6',
        '1testField name7',
        '1testField name8',
        '1testField name9',
        '1testField name10',
      ].map((fieldName) => {
        return generateUniqueFieldName(fieldName, usedFieldNames);
      });
      expect(mappedFieldNames[0]).toEqual('testFieldName');
      expect(mappedFieldNames[1]).toEqual('testFieldName1');
      expect(mappedFieldNames[10]).toEqual('testFieldName10');
      expect(usedFieldNames.size).toEqual(mappedFieldNames.length);
      expect(usedFieldNames.has('testFieldName'.toLowerCase())).toBeTruthy();
      expect(usedFieldNames.has('testFieldName1'.toLowerCase())).toBeTruthy();
      expect(usedFieldNames.has('testFieldName10'.toLowerCase())).toBeTruthy();
    });
    it('should skip nested json', () => {
      const mappedFieldNames = ['bio.favorite Book', 'bio.favorite Quote', 'bio.f{a}v)o(r&it#eQ#uo*t@e'].map(
        (fieldName) => {
          return generateUniqueFieldName(fieldName, usedFieldNames);
        },
      );
      expect(mappedFieldNames[0]).toBeFalsy();
      expect(mappedFieldNames[1]).toBeFalsy();
      expect(mappedFieldNames[2]).toBeFalsy();
      expect(usedFieldNames.has('bio')).toBeTruthy();
      expect(usedFieldNames.has('bio1')).toBeFalsy();
      expect(usedFieldNames.has('favoriteQuote'.toLowerCase())).toBeFalsy();
    });
  });
  describe('isValidVariableName tests', () => {
    it('valid variable strings', () => {
      const validNames = ['testFieldName', '$asdf', '___', '_12_13asfd24'];
      validNames.forEach((name) => {
        expect(isValidVariableName(name)).toBeTruthy();
      });
    });
    it('invalid variable names', () => {
      const invalidNames = ['1testFieldName', '$as df', '_-__', '', 'asd!@#$asdf'];
      invalidNames.forEach((name) => {
        expect(isValidVariableName(name)).toBeFalsy();
      });
    });
  });
});
