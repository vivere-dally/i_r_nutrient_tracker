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
import { MealProvider } from './meal/meal-provider';
import MealPage from './meal/component/MealPage';
import EditMealPage from './meal/component/EditMealPage';
import { AuthenticationProvider } from './authentication/authentication-provider';
import { AuthenticationPage } from './authentication/component/AuthenticationPage';
import { PrivateRoute } from './authentication/component/PrivateRoute';

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <AuthenticationProvider>
          {/* Authentication Provider Routes */}
          <Route path="/login" component={AuthenticationPage} exact={true} />
          <Route exact path="/" render={() => <Redirect to="/meals" />} />

          <MealProvider>
            {/* Meal Provider Routes */}
            <PrivateRoute path="/meals" component={MealPage} exact={true} />
            <PrivateRoute path="/meals/:id" component={EditMealPage} exact={true} />
            <PrivateRoute path="/meal" component={EditMealPage} exact={true} />
          </MealProvider>
        </AuthenticationProvider>
      </IonRouterOutlet>
    </IonReactRouter>

  </IonApp>
);

export default App;
