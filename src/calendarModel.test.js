import {describe,it,expect} from 'vitest';
import {localDay,monthDays,eventOnDay,heritageOnDay} from './calendarModel';
describe('separate Palace calendars',()=>{
 it('handles leap years and local dates',()=>{expect(monthDays(2028,1)).toHaveLength(29);expect(localDay(new Date(2026,9,5))).toBe('2026-10-05')});
 it('keeps multi-day events visible across months',()=>{const e={starts_at:new Date(2026,9,31,15).toISOString(),ends_at:new Date(2026,10,2,18).toISOString()};expect(eventOnDay(e,'2026-11-01')).toBe(true);expect(eventOnDay(e,'2026-11-03')).toBe(false)});
 it('shows month-long heritage observances throughout that month',()=>{const h={month:2,recurring:true};expect(heritageOnDay(h,'2028-02-29')).toBe(true);expect(heritageOnDay(h,'2028-03-01')).toBe(false)});
 it('respects one-off years and cross-year ranges',()=>{expect(heritageOnDay({month:5,day:15,year:2026,recurring:false},'2027-05-15')).toBe(false);const h={month:12,day:26,end_month:1,end_day:1,recurring:true};expect(heritageOnDay(h,'2027-01-01')).toBe(true);expect(heritageOnDay(h,'2027-07-01')).toBe(false)});
 it('does not match malformed event dates',()=>expect(eventOnDay({starts_at:'invalid'},'2026-10-05')).toBe(false));
});
