
import { PipeTransform, Injectable, ArgumentMetadata, HttpException, HttpStatus } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {

    if (value instanceof Object && this.isEmpty(value)) {
      throw new HttpException('Validation failed: No Body Submitted', HttpStatus.BAD_REQUEST);
    }

    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToClass(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      throw new HttpException(`Validation failed: ${this.formatErrors(errors)}`, HttpStatus.BAD_REQUEST);
    }
    return value;
  }

  // tslint:disable-next-line:ban-types
  private toValidate(metatype: Function): boolean {
    // tslint:disable-next-line:ban-types
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: any[]) {
    return errors.map((err) => {
      // tslint:disable-next-line:forin
      for (const property in err.constraints) {
        return err.constraints[property];
      }
    })
      .join(', ');
  }

  private isEmpty(value: any) {
    return Object.keys(value).length > 0 ? false : true;
  }
}
