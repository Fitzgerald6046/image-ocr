/**
 * 证件识别与验证服务
 * 提供隐私保护、字段验证、真实性检查等功能
 */
class IdCardValidatorService {
  constructor() {
    // 证件类型定义
    this.cardTypes = {
      idCard: {
        name: '身份证',
        fields: ['姓名', '性别', '民族', '出生', '住址', '公民身份号码', '签发机关', '有效期限'],
        patterns: {
          idNumber: /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
          name: /^[\u4e00-\u9fa5]{2,6}(·[\u4e00-\u9fa5]{2,6})*$/
        }
      },
      passport: {
        name: '护照',
        fields: ['类型', '国家代码', '护照号码', '姓名', '国籍', '出生日期', '性别', '签发日期', '有效期至', '签发机关'],
        patterns: {
          passportNumber: /^[A-Z]\d{8}$/,
          name: /^[A-Za-z\s]+$/
        }
      },
      drivingLicense: {
        name: '驾驶证',
        fields: ['证号', '姓名', '性别', '出生日期', '初次领证日期', '准驾车型', '有效期限', '住址'],
        patterns: {
          licenseNumber: /^\d{12}$/,
          name: /^[\u4e00-\u9fa5]{2,6}$/
        }
      },
      bankCard: {
        name: '银行卡',
        fields: ['卡号', '户名', '开户行', '有效期'],
        patterns: {
          cardNumber: /^\d{16,19}$/
        }
      }
    };

    // 隐私保护规则
    this.privacyRules = {
      idNumber: {
        maskPattern: (value) => value.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2'),
        riskLevel: 'high'
      },
      name: {
        maskPattern: (value) => value.replace(/(.)(.+)(.)/, '$1*$3'),
        riskLevel: 'medium'
      },
      address: {
        maskPattern: (value) => value.replace(/(.{6}).*(.{4})/, '$1****$2'),
        riskLevel: 'medium'
      },
      phone: {
        maskPattern: (value) => value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
        riskLevel: 'medium'
      },
      bankCard: {
        maskPattern: (value) => value.replace(/(\d{4})\d{8,12}(\d{4})/, '$1****$2'),
        riskLevel: 'high'
      }
    };

    // 验证规则
    this.validationRules = {
      idCard: {
        checksum: this.validateIdCardChecksum.bind(this),
        format: this.validateIdCardFormat.bind(this)
      }
    };
  }

  /**
   * 分析证件信息
   */
  async analyzeIdCard(recognitionContent, options = {}) {
    try {
      console.log('🆔 开始分析证件信息...');
      
      // 提取结构化信息
      const extractedData = this.extractIdCardData(recognitionContent);
      
      // 检测证件类型
      const cardType = this.detectCardType(extractedData);
      
      // 字段验证
      const validation = this.validateFields(extractedData, cardType);
      
      // 隐私保护处理
      const protectedData = this.applyPrivacyProtection(extractedData, options);
      
      // 安全性评估
      const securityAssessment = this.assessSecurity(extractedData, cardType);
      
      return {
        success: true,
        analysis: {
          cardType,
          extractedData: protectedData,
          originalData: options.keepOriginal ? extractedData : undefined,
          validation,
          securityAssessment,
          privacyLevel: options.privacyLevel || 'medium',
          summary: {
            cardTypeName: this.cardTypes[cardType]?.name || '未知证件',
            isValid: validation.isValid,
            riskLevel: securityAssessment.riskLevel,
            extractedFields: Object.keys(extractedData).length
          }
        }
      };
      
    } catch (error) {
      console.error('证件分析失败:', error);
      return {
        success: false,
        error: error.message,
        analysis: null
      };
    }
  }

  /**
   * 提取证件数据
   */
  extractIdCardData(content) {
    const data = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;

      // 身份证号码
      const idMatch = cleanLine.match(/(?:公民身份号码|身份证号|证件号码)[\s:：]*(\d{17}[\dXx])/);
      if (idMatch) {
        data.idNumber = idMatch[1];
        continue;
      }

      // 姓名
      const nameMatch = cleanLine.match(/(?:姓名|户名)[\s:：]*([\u4e00-\u9fa5·]{2,10})/);
      if (nameMatch) {
        data.name = nameMatch[1];
        continue;
      }

      // 性别
      const genderMatch = cleanLine.match(/(?:性别)[\s:：]*([男女])/);
      if (genderMatch) {
        data.gender = genderMatch[1];
        continue;
      }

      // 出生日期
      const birthMatch = cleanLine.match(/(?:出生|出生日期)[\s:：]*(\d{4}年\d{1,2}月\d{1,2}日|\d{4}-\d{2}-\d{2}|\d{4}\.\d{2}\.\d{2})/);
      if (birthMatch) {
        data.birthDate = birthMatch[1];
        continue;
      }

      // 地址
      const addressMatch = cleanLine.match(/(?:住址|地址)[\s:：]*(.{6,50})/);
      if (addressMatch) {
        data.address = addressMatch[1];
        continue;
      }

      // 有效期
      const validityMatch = cleanLine.match(/(?:有效期限|有效期)[\s:：]*(\d{4}\.\d{2}\.\d{2}[-~至]\d{4}\.\d{2}\.\d{2}|长期)/);
      if (validityMatch) {
        data.validity = validityMatch[1];
        continue;
      }

      // 签发机关
      const issuerMatch = cleanLine.match(/(?:签发机关)[\s:：]*(.{6,20})/);
      if (issuerMatch) {
        data.issuer = issuerMatch[1];
        continue;
      }

      // 护照号码
      const passportMatch = cleanLine.match(/(?:护照号码|护照号)[\s:：]*([A-Z]\d{8})/);
      if (passportMatch) {
        data.passportNumber = passportMatch[1];
        continue;
      }

      // 银行卡号
      const bankCardMatch = cleanLine.match(/(?:卡号|账号)[\s:：]*(\d{16,19})/);
      if (bankCardMatch) {
        data.bankCard = bankCardMatch[1];
        continue;
      }
    }

    return data;
  }

  /**
   * 检测证件类型
   */
  detectCardType(data) {
    if (data.idNumber && this.cardTypes.idCard.patterns.idNumber.test(data.idNumber)) {
      return 'idCard';
    }
    
    if (data.passportNumber && this.cardTypes.passport.patterns.passportNumber.test(data.passportNumber)) {
      return 'passport';
    }
    
    if (data.bankCard && this.cardTypes.bankCard.patterns.cardNumber.test(data.bankCard)) {
      return 'bankCard';
    }
    
    // 根据字段组合判断
    if (data.name && data.gender && data.birthDate) {
      return 'idCard';
    }
    
    return 'unknown';
  }

  /**
   * 字段验证
   */
  validateFields(data, cardType) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      fieldValidation: {}
    };

    // 身份证验证
    if (cardType === 'idCard' && data.idNumber) {
      const checksumValid = this.validateIdCardChecksum(data.idNumber);
      const formatValid = this.validateIdCardFormat(data.idNumber);
      
      validation.fieldValidation.idNumber = {
        format: formatValid,
        checksum: checksumValid,
        isValid: formatValid && checksumValid
      };

      if (!formatValid) {
        validation.errors.push('身份证号码格式不正确');
        validation.isValid = false;
      }
      
      if (!checksumValid) {
        validation.errors.push('身份证号码校验位不正确');
        validation.isValid = false;
      }

      // 出生日期一致性检查
      if (data.birthDate && formatValid) {
        const idBirth = data.idNumber.substring(6, 14);
        const birthConsistent = this.checkBirthDateConsistency(data.birthDate, idBirth);
        
        validation.fieldValidation.birthDate = {
          consistent: birthConsistent,
          idBirth: `${idBirth.substring(0,4)}-${idBirth.substring(4,6)}-${idBirth.substring(6,8)}`,
          extractedBirth: data.birthDate
        };

        if (!birthConsistent) {
          validation.warnings.push('出生日期与身份证号码中的日期不一致');
        }
      }
    }

    // 姓名验证
    if (data.name) {
      const nameValid = this.cardTypes.idCard.patterns.name.test(data.name);
      validation.fieldValidation.name = {
        format: nameValid,
        isValid: nameValid
      };

      if (!nameValid) {
        validation.warnings.push('姓名格式可能不正确');
      }
    }

    return validation;
  }

  /**
   * 身份证校验位验证
   */
  validateIdCardChecksum(idNumber) {
    if (idNumber.length !== 18) return false;

    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idNumber[i]) * weights[i];
    }
    
    const checkCode = checkCodes[sum % 11];
    return idNumber[17].toUpperCase() === checkCode;
  }

  /**
   * 身份证格式验证
   */
  validateIdCardFormat(idNumber) {
    return this.cardTypes.idCard.patterns.idNumber.test(idNumber);
  }

  /**
   * 出生日期一致性检查
   */
  checkBirthDateConsistency(extractedBirth, idBirth) {
    // 将提取的出生日期转换为YYYYMMDD格式
    let normalizedBirth = extractedBirth
      .replace(/年|月/g, '')
      .replace(/日/g, '')
      .replace(/[-\.]/g, '');
    
    // 补零
    if (normalizedBirth.length === 7) {
      normalizedBirth = normalizedBirth.substring(0, 5) + '0' + normalizedBirth.substring(5);
    }
    
    return normalizedBirth === idBirth;
  }

  /**
   * 应用隐私保护
   */
  applyPrivacyProtection(data, options) {
    const privacyLevel = options.privacyLevel || 'medium';
    const protectedData = { ...data };

    if (privacyLevel === 'none') {
      return protectedData;
    }

    // 根据隐私级别应用保护
    for (const [field, value] of Object.entries(protectedData)) {
      if (typeof value === 'string') {
        // 身份证号码
        if (field === 'idNumber' && privacyLevel !== 'low') {
          protectedData[field] = this.privacyRules.idNumber.maskPattern(value);
        }
        
        // 姓名
        if (field === 'name' && privacyLevel === 'high') {
          protectedData[field] = this.privacyRules.name.maskPattern(value);
        }
        
        // 地址
        if (field === 'address' && privacyLevel !== 'low') {
          protectedData[field] = this.privacyRules.address.maskPattern(value);
        }
        
        // 银行卡号
        if (field === 'bankCard' && privacyLevel !== 'low') {
          protectedData[field] = this.privacyRules.bankCard.maskPattern(value);
        }
      }
    }

    return protectedData;
  }

  /**
   * 安全性评估
   */
  assessSecurity(data, cardType) {
    const assessment = {
      riskLevel: 'low',
      riskFactors: [],
      recommendations: [],
      score: 100
    };

    // 检查敏感信息
    if (data.idNumber) {
      assessment.riskFactors.push('包含身份证号码');
      assessment.score -= 30;
    }

    if (data.bankCard) {
      assessment.riskFactors.push('包含银行卡号');
      assessment.score -= 40;
    }

    if (data.address) {
      assessment.riskFactors.push('包含住址信息');
      assessment.score -= 20;
    }

    // 评估风险等级
    if (assessment.score >= 80) {
      assessment.riskLevel = 'low';
      assessment.recommendations.push('建议启用基础隐私保护');
    } else if (assessment.score >= 60) {
      assessment.riskLevel = 'medium';
      assessment.recommendations.push('建议启用中等隐私保护');
      assessment.recommendations.push('避免在公共场所使用');
    } else {
      assessment.riskLevel = 'high';
      assessment.recommendations.push('建议启用高级隐私保护');
      assessment.recommendations.push('避免通过网络传输');
      assessment.recommendations.push('使用后及时删除识别结果');
    }

    return assessment;
  }

  /**
   * 生成安全报告
   */
  generateSecurityReport(analysis) {
    const { cardType, validation, securityAssessment, extractedData } = analysis;
    
    const report = {
      title: `${this.cardTypes[cardType]?.name || '证件'}安全分析报告`,
      timestamp: new Date().toISOString(),
      summary: {
        validationStatus: validation.isValid ? '✅ 验证通过' : '❌ 验证失败',
        riskLevel: securityAssessment.riskLevel,
        securityScore: securityAssessment.score
      },
      details: {
        extractedFields: Object.keys(extractedData).length,
        validationErrors: validation.errors.length,
        riskFactors: securityAssessment.riskFactors.length
      },
      recommendations: securityAssessment.recommendations
    };

    return report;
  }
}

export default IdCardValidatorService; 