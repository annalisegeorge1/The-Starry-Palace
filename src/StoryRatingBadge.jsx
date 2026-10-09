import React from 'react';
import {storyRatingInfo} from './storyRatingModel';
import './story-rating-badges.css';

/** A content classification, not a star/review score. */
export default function StoryRatingBadge({rating,className=''}) {
 const {key,label}=storyRatingInfo(rating);
 return <span className={'palace-story-rating rating-'+key+(className?' '+className:'')}
  aria-label={'Content rating: '+label}>{label}</span>;
}
