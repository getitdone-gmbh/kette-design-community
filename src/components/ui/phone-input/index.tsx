'use client';

import parsePhoneNumberFromString, {
  AsYouType,
  type CarrierCode,
  type CountryCallingCode,
  type CountryCode,
  type E164Number,
  type NationalNumber,
  type NumberType,
} from 'libphonenumber-js';
import { Check, ChevronsUpDown } from 'lucide-react';
import { ClipboardEvent, ComponentPropsWithoutRef, FC, FormEvent, KeyboardEvent, useRef, useState } from 'react';
import { cn } from '../../../lib/utils';
import { Button } from '../button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../command';
import { Input } from '../input';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { ScrollArea } from '../scroll-area';
import { countries } from './countries';
import { useStateHistory } from './use-state-history';
import { useLabels } from '../labels-context';

export type Country = (typeof countries)[number];

export type PhoneData = {
  phoneNumber?: E164Number;
  countryCode?: CountryCode;
  countryCallingCode?: CountryCallingCode;
  carrierCode?: CarrierCode;
  nationalNumber?: NationalNumber;
  internationalNumber?: string;
  possibleCountries?: string;
  isValid?: boolean;
  isPossible?: boolean;
  uri?: string;
  type?: NumberType;
};

export interface PhoneInputProps extends ComponentPropsWithoutRef<'input'> {
  value?: string;
  defaultCountry?: CountryCode;
  // Folder that serves the flag SVGs (the `flags` folder of the package). Flags that fail to load are hidden instead of showing a broken image.
  flagBasePath?: string;
}

export function getPhoneData(phone: string): PhoneData {
  const asYouType = new AsYouType();
  asYouType.input(phone);
  const number = asYouType.getNumber();
  return {
    phoneNumber: number?.number,
    countryCode: number?.country,
    countryCallingCode: number?.countryCallingCode,
    carrierCode: number?.carrierCode,
    nationalNumber: number?.nationalNumber,
    internationalNumber: number?.formatInternational(),
    possibleCountries: number?.getPossibleCountries().join(', '),
    isValid: number?.isValid(),
    isPossible: number?.isPossible(),
    uri: number?.getURI(),
    type: number?.getType(),
  };
}

export const PhoneInput: FC<PhoneInputProps> = ({
  value: valueProp,
  defaultCountry = 'US',
  flagBasePath = '/flags',
  className,
  id,
  required = true,
  ...rest
}: PhoneInputProps) => {
  const l = useLabels();
  const asYouType = new AsYouType();

  const inputRef = useRef<HTMLInputElement>(null);

  const [value, handlers, history] = useStateHistory(valueProp);

  if (value && value.length > 0) {
    defaultCountry = parsePhoneNumberFromString(value)?.getPossibleCountries()[0] || defaultCountry;
  }

  const [openCommand, setOpenCommand] = useState(false);
  const [countryCode, setCountryCode] = useState<CountryCode>(defaultCountry);

  const selectedCountry = countries.find((country) => country.iso2 === countryCode);

  const initializeDefaultValue = () => {
    if (value) {
      return value;
    }

    return `+${selectedCountry?.phone_code}`;
  };

  const handleOnInput = (event: FormEvent<HTMLInputElement>) => {
    asYouType.reset();

    let value = event.currentTarget.value;
    if (!value.startsWith('+')) {
      value = `+${value}`;
    }

    const formattedValue = asYouType.input(value);
    const number = asYouType.getNumber();
    setCountryCode(number?.country || defaultCountry);
    event.currentTarget.value = formattedValue;
    handlers.set(formattedValue);
  };

  const handleOnPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    asYouType.reset();

    const clipboardData = event.clipboardData;

    if (clipboardData) {
      const pastedData = clipboardData.getData('text/plain');
      const formattedValue = asYouType.input(pastedData);
      const number = asYouType.getNumber();
      setCountryCode(number?.country || defaultCountry);
      event.currentTarget.value = formattedValue;
      handlers.set(formattedValue);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
      handlers.back();
      if (inputRef.current && history.current > 0 && history.history[history.current - 1] !== undefined) {
        event.preventDefault();
        inputRef.current.value = history.history[history.current - 1] || '';
      }
    }
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Popover open={openCommand} onOpenChange={setOpenCommand} modal={true}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={openCommand}
            // Name = action + current value, so the visible code stays part of the accessible name.
            aria-label={selectedCountry?.name ? `${l.selectCountry}: ${selectedCountry.iso2} +${selectedCountry.phone_code}` : l.selectCountry}
            className="w-max items-center justify-between whitespace-nowrap"
          >
            {selectedCountry?.name ? (
              <span data-phone-country-code="" className="tabular-nums">
                {selectedCountry.iso2} +{selectedCountry.phone_code}
              </span>
            ) : (
              l.selectCountry
            )}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-max" align="start">
          <Command>
            <CommandInput placeholder={l.searchCountry} />
            <CommandList>
              <CommandEmpty>{l.noCountryFound}</CommandEmpty>
              <ScrollArea className={'[&>[data-radix-scroll-area-viewport]]:max-h-[300px]'}>
                <CommandGroup>
                  {countries.map((country) => {
                    return (
                      <CommandItem
                        key={country.iso2}
                        value={`${country.name} (+${country.phone_code})`}
                        onSelect={() => {
                          if (inputRef.current) {
                            inputRef.current.value = `+${country.phone_code}`;
                            handlers.set(`+${country.phone_code}`);
                            inputRef.current.focus();
                          }
                          setCountryCode(country.iso2 as CountryCode);
                          setOpenCommand(false);
                        }}
                      >
                        <Check className={cn('mr-2 size-4', countryCode === country.iso2 ? '' : 'opacity-[0]')} />
                        <img
                          src={`${flagBasePath}/${country.iso2.toLowerCase()}.svg`}
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                          className="relative top-[2px] mr-2 w-4 h-3 object-cover"
                          title={country.name}
                          alt=""
                          aria-hidden="true"
                        />
                        {country.name}
                        <span className="ml-1 text-text-subtle">(+{country.phone_code})</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        ref={inputRef}
        type="text"
        pattern="^(\+)?[0-9\s]*$"
        name="phone"
        id={id}
        placeholder={l.phone}
        defaultValue={initializeDefaultValue()}
        onInput={handleOnInput}
        onPaste={handleOnPaste}
        onKeyDown={handleKeyDown}
        required={required}
        aria-required={required}
        {...rest}
      />
    </div>
  );
};
