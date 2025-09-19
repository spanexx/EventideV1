import { Injectable } from '@angular/core';
import { Availability } from '../models/availability.models';

interface AllDaySlot {
    startTime: Date;
    endTime: Date;
    duration: number;
}

@Injectable({
    providedIn: 'root'
})
export class AvailabilityGenerationService {

    constructor() { }

    calculateEvenDistribution(
        date: Date,
        dayStartTime: string,
        dayEndTime: string,
        slotConfigurationMode: 'slots' | 'minutes',
        numberOfSlots: number,
        minutesPerSlot: number,
        breakTime: number
    ): AllDaySlot[] {
        const slots: AllDaySlot[] = [];
        const [startHours, startMinutes] = dayStartTime.split(':').map(Number);
        const [endHours, endMinutes] = dayEndTime.split(':').map(Number);

        const workingStart = new Date(date || new Date());
        workingStart.setHours(startHours, startMinutes, 0, 0);

        const workingEnd = new Date(date || new Date());
        workingEnd.setHours(endHours, endMinutes, 0, 0);

        const workingMinutes = (workingEnd.getTime() - workingStart.getTime()) / (1000 * 60);

        if (workingMinutes <= 0) {
            return slots;
        }

        let calculatedNumberOfSlots: number;
        if (slotConfigurationMode === 'minutes') {
            calculatedNumberOfSlots = Math.floor((workingMinutes + breakTime) / (minutesPerSlot + breakTime));
            if (calculatedNumberOfSlots < 1) calculatedNumberOfSlots = 1;
        } else {
            calculatedNumberOfSlots = numberOfSlots;
        }

        const totalTimeForBreaks = (calculatedNumberOfSlots - 1) * breakTime;
        const timePerSlot = (workingMinutes - totalTimeForBreaks) / calculatedNumberOfSlots;

        if (timePerSlot < 15) {
            calculatedNumberOfSlots = Math.floor((workingMinutes + breakTime) / (15 + breakTime));
            if (calculatedNumberOfSlots < 1) calculatedNumberOfSlots = 1;

            const adjustedTotalTimeForBreaks = (calculatedNumberOfSlots - 1) * breakTime;
            const adjustedTimePerSlot = (workingMinutes - adjustedTotalTimeForBreaks) / calculatedNumberOfSlots;
        }

        let currentTime = new Date(workingStart);
        for (let i = 0; i < calculatedNumberOfSlots; i++) {
            const startTime = new Date(currentTime);
            const endTime = new Date(currentTime.getTime() + timePerSlot * 60000);
            slots.push({
                startTime: startTime,
                endTime: endTime,
                duration: Math.round(timePerSlot)
            });
            if (i < calculatedNumberOfSlots - 1) {
                currentTime = new Date(endTime.getTime() + breakTime * 60000);
            }
        }
        return slots;
    }

    generateBulkSlots(
        providerId: string,
        availability: Availability,
        dateRangeMode: 'single' | 'range',
        quantity: number,
        startDate: Date | null,
        endDate: Date | null
    ): Availability[] {
        const slots: Availability[] = [];
        if (dateRangeMode === 'single') {
            for (let i = 0; i < quantity; i++) {
                const tempId = `temp-${Date.now()}-${Math.random()}-${i}`;
                const slot: Availability = {
                    ...availability,
                    id: tempId,
                    providerId: providerId,
                };
                slots.push(slot);
            }
        } else if (dateRangeMode === 'range' && startDate && endDate) {
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const tempId = `temp-${Date.now()}-${Math.random()}-${currentDate.getTime()}`;
                const startDateTime = new Date(currentDate);
                startDateTime.setHours(availability.startTime.getHours(), availability.startTime.getMinutes(), 0, 0);
                const endDateTime = new Date(currentDate);
                endDateTime.setHours(availability.endTime.getHours(), availability.endTime.getMinutes(), 0, 0);
                const slot: Availability = {
                    ...availability,
                    id: tempId,
                    providerId: providerId,
                    date: new Date(currentDate),
                    startTime: startDateTime,
                    endTime: endDateTime,
                };
                slots.push(slot);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        return slots;
    }
}
