import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import MealPage from './pages/MealPage';
import { MealProvider } from './services/providers/meal-provider';
import { FoodProvider } from './services/providers/food-provider';
import { NutrientProvider } from './services/providers/nutrient-provider';
import EditMealPage from './pages/EditMealPage';

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        {/* NUTRIENT PROVIDER */}
        <NutrientProvider>
          {/* FOOD PROVIDER */}
          <FoodProvider>
            {/* FOOD PROVIDER ROUTES */}
            {/* <Route path="/food" component={FoodPage} exact={true} /> */}
            {/* <Route path="/food/:id" component={FoodPage} exact={true} /> */}
            {/* MEAL PROVIDER */}
            <MealProvider>
              {/* MEAL PROVIDER ROUTES */}
              <Route path="/meal" component={MealPage} exact={true} />
              <Route path="/meal/:id" component={EditMealPage} exact={true} />
              <Route exact path="/" render={() => <Redirect to="/meal" />} />
            </MealProvider>
          </FoodProvider>
        </NutrientProvider>

      </IonRouterOutlet>
    </IonReactRouter>

  </IonApp>
);

export default App;
