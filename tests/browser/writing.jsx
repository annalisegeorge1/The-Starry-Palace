import React from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
import {WorkStudioLive} from '../../src/liveRooms';
createRoot(document.getElementById('root')).render(
 <MemoryRouter initialEntries={['/writing/synthetic']}><Routes>
  <Route path="/writing/:slug" element={<WorkStudioLive Frame={React.Fragment}/>}/>
 </Routes></MemoryRouter>
);
