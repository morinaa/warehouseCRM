import { useState } from 'react';
import { Box, FormControl, FormLabel, Input, InputGroup, InputLeftElement, List, ListItem } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { COUNTRIES } from '../constants/lookups';

type Props = {
  label: string;
  value?: string;
  onChange: (country: string) => void;
  placeholder?: string;
};

export const CountrySelect = ({ label, value, onChange, placeholder = 'Type to search country' }: Props) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const display = query || value || '';
  const filtered = COUNTRIES.filter((c) => c.toLowerCase().includes(display.toLowerCase()));

  return (
    <FormControl position="relative">
      <FormLabel>{label}</FormLabel>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.400" />
        </InputLeftElement>
        <Input
          value={display}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
        />
      </InputGroup>
      {open && filtered.length > 0 && (
        <Box
          mt={1}
          borderWidth="1px"
          borderColor="gray.200"
          rounded="md"
          bg="white"
          maxH="180px"
          overflowY="auto"
          shadow="sm"
          zIndex={10}
          position="absolute"
          width="full"
        >
          <List spacing={0}>
            {filtered.map((c) => (
              <ListItem
                key={c}
                px={3}
                py={2}
                _hover={{ bg: 'gray.50' }}
                cursor="pointer"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(c);
                  setQuery('');
                  setOpen(false);
                }}
              >
                {c}
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </FormControl>
  );
};

export default CountrySelect;
