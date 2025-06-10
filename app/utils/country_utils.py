"""
Country utilities for robust country code and name handling.
Uses pycountry library for accurate ISO 3166-1 country data.
"""

from typing import Optional
import pycountry
from app.config.loggers import app_logger as logger


def get_country_name_from_code(country_code: str) -> Optional[str]:
    """
    Get the country name from ISO 3166-1 alpha-2 country code.
    
    Args:
        country_code: ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB')
        
    Returns:
        Country name or None if not found
        
    Examples:
        >>> get_country_name_from_code('US')
        'United States'
        >>> get_country_name_from_code('GB')
        'United Kingdom'
    """
    if not country_code:
        return None
        
    try:
        # Normalize to uppercase
        normalized_code = country_code.upper().strip()
        
        # Use pycountry to get country data
        country = pycountry.countries.get(alpha_2=normalized_code)
        
        if country:
            return country.name
            
        return None
        
    except Exception as e:
        logger.warning(f"Error getting country name for code '{country_code}': {str(e)}")
        return None


def get_country_code_from_name(country_name: str) -> Optional[str]:
    """
    Get the ISO 3166-1 alpha-2 country code from country name.
    
    Args:
        country_name: Country name (e.g., 'United States', 'United Kingdom')
        
    Returns:
        ISO 3166-1 alpha-2 country code or None if not found
        
    Examples:
        >>> get_country_code_from_name('United States')
        'US'
        >>> get_country_code_from_name('United Kingdom')
        'GB'
    """
    if not country_name:
        return None
        
    try:
        # Normalize the name
        normalized_name = country_name.strip()
        
        # Try exact match first
        try:
            country = pycountry.countries.get(name=normalized_name)
            if country:
                return country.alpha_2
        except KeyError:
            pass
            
        # Try fuzzy lookup for common variations
        try:
            country = pycountry.countries.lookup(normalized_name)
            if country:
                return country.alpha_2
        except LookupError:
            pass
            
        return None
        
    except Exception as e:
        logger.warning(f"Error getting country code for name '{country_name}': {str(e)}")
        return None


def validate_country_code(country_code: str) -> bool:
    """
    Validate if a country code is a valid ISO 3166-1 alpha-2 code.
    
    Args:
        country_code: Country code to validate
        
    Returns:
        True if valid, False otherwise
        
    Examples:
        >>> validate_country_code('US')
        True
        >>> validate_country_code('XX')
        False
    """
    if not country_code:
        return False
        
    try:
        normalized_code = country_code.upper().strip()
        country = pycountry.countries.get(alpha_2=normalized_code)
        return country is not None
        
    except Exception as e:
        logger.warning(f"Error validating country code '{country_code}': {str(e)}")
        return False


def normalize_country_code(country_code: str) -> Optional[str]:
    """
    Normalize and validate a country code.
    
    Args:
        country_code: Country code to normalize
        
    Returns:
        Normalized uppercase country code or None if invalid
        
    Examples:
        >>> normalize_country_code('us')
        'US'
        >>> normalize_country_code(' gb ')
        'GB'
        >>> normalize_country_code('invalid')
        None
    """
    if not country_code:
        return None
        
    try:
        normalized_code = country_code.upper().strip()
        
        if validate_country_code(normalized_code):
            return normalized_code
            
        return None
        
    except Exception as e:
        logger.warning(f"Error normalizing country code '{country_code}': {str(e)}")
        return None


def get_all_countries() -> list[dict]:
    """
    Get all countries with their codes and names.
    
    Returns:
        List of dictionaries with 'code' and 'name' keys
    """
    try:
        countries = []
        for country in pycountry.countries:
            countries.append({
                'code': country.alpha_2,
                'name': country.name
            })
        
        # Sort by name for consistent ordering
        return sorted(countries, key=lambda x: x['name'])
        
    except Exception as e:
        logger.error(f"Error getting all countries: {str(e)}")
        return []


def format_country_for_display(country_code: Optional[str]) -> str:
    """
    Format country for display purposes.
    Returns country name if available, otherwise returns the code.
    
    Args:
        country_code: ISO 3166-1 alpha-2 country code
        
    Returns:
        Formatted country string for display
        
    Examples:
        >>> format_country_for_display('US')
        'United States'
        >>> format_country_for_display('XX')
        'XX'
        >>> format_country_for_display(None)
        'Unknown'
    """
    if not country_code:
        return 'Unknown'
        
    country_name = get_country_name_from_code(country_code)
    return country_name if country_name else country_code.upper()